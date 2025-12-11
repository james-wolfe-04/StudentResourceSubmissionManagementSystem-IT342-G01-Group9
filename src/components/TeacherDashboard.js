import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { fetchUserNotifications, markAllReadForUser } from "../api/notifications";
import "./styles/TeacherDashboard.css";
import classesIcon from "./assets/classes-icon.png";
import submissionsIcon from "./assets/submissions-icon.png";
import notificationsIcon from "./assets/notifications-icon.png";
import logo from "./assets/logo.png";
import { BookOpen, Plus, X, Check, Trash2, FileText, Users } from "lucide-react";
import notifPng from "./assets/notifications-icon.png";
import logoutPng from "./assets/logout-icon.png";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";
import Toast from "./ui/Toast";

export default function TeacherDashboard({ user, onLogout }) {
    const displayName = (() => {
        const name = user?.fullName || user?.name;
        if (name && name.trim().length > 0) return name;
        const email = user?.email || "";
        const local = email.split("@")[0] || "User";
        return local.replace(/\./g, " ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    })();
    const [activePage, setActivePage] = useState("classes");
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClass, setNewClass] = useState({ name: "", subject: "", section: "", description: "" });

    const [selectedClass, setSelectedClass] = useState(null);
    const [assignForm, setAssignForm] = useState({ title: "", description: "", deadline: "" });
    const [assignFile, setAssignFile] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);

    const loadClasses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/classes/teacher/${user.id}`);
            setClasses(res.data || []);
        } catch (e) {
            console.error(e);
            alert("Failed to load classes");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const [notifCount, setNotifCount] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const [notifItems, setNotifItems] = useState([]);
    const [notifPage, setNotifPage] = useState(0);
    const notifPageSize = 20;
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

    useEffect(() => {
        if (user?.id) {
            loadClasses();
            // Load unread notifications count
            (async () => {
                try {
                    const items = await fetchUserNotifications(user.id);
                    setNotifItems(items);
                    setNotifCount(items.filter(n => !n.readFlag).length);
                    setNotifPage(0);
                } catch (_) {
                    setNotifItems([]);
                    setNotifCount(0);
                }
            })();
        }
    }, [user?.id, loadClasses]);

    // Deep link handler for notifications: #/notifications/{id}
    useEffect(() => {
        const handleHashLink = async () => {
            const hash = window.location.hash || "";
            const m = hash.match(/^#\/notifications\/(\d+)$/);
            if (m && user?.id) {
                const id = Number(m[1]);
                try {
                    const res = await api.get(`/notifications/${id}`);
                    const n = res.data;
                    if (!n) return;
                    try { await api.post(`/notifications/${id}/read`); } catch (_) { }
                    if (n.type === 'RESOURCE' && n.relatedClassId) {
                        const cls = classes.find(c => c.id === n.relatedClassId);
                        if (cls) {
                            await openClassDetails(cls);
                            setActivePage('resources');
                            if (n.relatedEntityId) setSelectedResource({ id: n.relatedEntityId });
                        } else {
                            setActivePage('classes');
                        }
                    } else if ((n.type === 'ASSIGNMENT' || n.type === 'GRADE') && n.relatedClassId) {
                        const cls = classes.find(c => c.id === n.relatedClassId);
                        if (cls) {
                            await openClassDetails(cls);
                        }
                        setActivePage('assignments');
                    } else if (n.type === 'JOIN_REQUEST' && n.relatedClassId) {
                        const cls = classes.find(c => c.id === n.relatedClassId);
                        if (cls) await openClassDetails(cls);
                        setActivePage('classes');
                    } else {
                        setActivePage('classes');
                    }
                } catch (_) {
                    // ignore if not accessible
                }
            }
        };
        handleHashLink();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        // Clear auth and notify parent; if no handler, hard redirect to login/root
        try {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        } catch (_) { }
        if (typeof onLogout === "function") {
            onLogout();
        } else {
            // Fallback to a full reload so auth guards re-evaluate
            window.location.href = "/";
        }
    };

    const createClass = async (e) => {
        e.preventDefault();
        try {
            await api.post("/classes", { ...newClass, teacherId: user.id });
            setShowCreateClass(false);
            setNewClass({ name: "", subject: "", section: "", description: "" });
            loadClasses();
        } catch (e) {
            console.error(e);
            alert("Failed to create class");
        }
    };

    const deleteClass = async (classId) => {
        if (!window.confirm("Delete this class permanently?")) return;
        try {
            await api.delete(`/classes/${classId}`);
            if (selectedClass?.id === classId) setSelectedClass(null);
            await loadClasses();
            // Show confirmation toast
            try { setToast({ open: true, type: 'success', message: 'Class deleted.' }); } catch (_) { }
        } catch (e) {
            // Error toast for visibility
            try { setToast({ open: true, type: 'error', message: 'Failed to delete class.' }); } catch (_) { }
        }
    };

    const openClassDetails = async (cls) => {
        // Load each piece; proceed with what succeeds to avoid blocking UI
        const [assignments, requests, students] = await Promise.allSettled([
            api.get(`/assignments/class/${cls.id}`),
            api.get(`/classes/${cls.id}/join-requests`),
            api.get(`/classes/${cls.id}/students`),
        ]);
        const assignmentsData = assignments.status === 'fulfilled' ? (assignments.value.data || []) : [];
        const requestsData = requests.status === 'fulfilled' ? (requests.value.data || []) : [];
        const studentsData = students.status === 'fulfilled' ? (students.value.data || []) : [];
        if (assignments.status !== 'fulfilled' || requests.status !== 'fulfilled' || students.status !== 'fulfilled') {
            console.warn('Some class detail calls failed', { assignments, requests, students });
        }
        setSelectedClass({ ...cls, students: studentsData, assignments: assignmentsData, pendingRequests: requestsData });
    };

    const handleJoinRequest = async (requestId, action) => {
        try {
            await api.post(`/classes/${requestId}/${action}`);
            if (selectedClass) openClassDetails(selectedClass);
        } catch (e) {
            alert(`Failed to ${action} request`);
        }
    };

    const postAssignment = async (e) => {
        e.preventDefault();
        if (!selectedClass) return;
        try {
            const res = await api.post("/assignments/create", {
                title: assignForm.title,
                description: assignForm.description,
                deadline: assignForm.deadline,
                classId: selectedClass.id,
            });
            const created = res.data;
            if (assignFile && created?.id) {
                const fd = new FormData();
                fd.append('file', assignFile);
                await api.post(`/assignments/${created.id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setAssignForm({ title: "", description: "", deadline: "" });
            setAssignFile(null);
            openClassDetails(selectedClass);
        } catch (e) {
            alert("Failed to post assignment");
        }
    };

    if (loading) return <div className="loading">Loading your classes...</div>;

    return (
        <div className="dashboard-container">
            <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="nav-left">
                    <img src={logo} alt="Logo" className="logo" />
                    <h2>Teacher Dashboard</h2>
                </div>
                <div className="nav-right">
                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                        <button className="icon-button" title="Notifications" aria-label="Open notifications" onClick={async () => {
                            try {
                                await markAllReadForUser(user.id);
                                const items = (await fetchUserNotifications(user.id)).map(n => ({ ...n, readFlag: true }));
                                setNotifItems(items);
                                setNotifCount(0);
                                setNotifPage(0);
                            } catch (_) {
                                // fallback values
                            }
                            setShowNotif(v => !v);
                        }}>
                            <img src={notifPng} alt="Notifications" style={{ width: 18, height: 18 }} />
                            {notifCount > 0 && <span className="notif-badge" aria-label={`${notifCount} unread notifications`}>{notifCount}</span>}
                        </button>
                        {showNotif && (
                            <div role="dialog" aria-label="Notifications" style={{ position: 'absolute', right: 0, top: 42, width: 300, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.08)', zIndex: 20 }}>
                                <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                    <strong>Notifications</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button className="btn btn--secondary btn--md" onClick={async () => {
                                            try {
                                                const res = await api.get(`/notifications/user/${user.id}`, { params: { page: 0, size: notifPageSize } });
                                                const items = res.data || [];
                                                setNotifItems(items);
                                                setNotifCount(items.filter(n => !n.readFlag).length);
                                                setNotifPage(0);
                                            } catch (_) { }
                                        }}>Refresh</button>
                                        {/* Removed mark-all button; handled automatically on open */}
                                        <button className="icon-button" aria-label="Close notifications" onClick={() => setShowNotif(false)} style={{ color: '#111' }}>×</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                    {notifItems.length === 0 ? (
                                        <div style={{ padding: 16, color: '#666' }}>No new notifications.</div>
                                    ) : (
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {notifItems.map(n => (
                                                <li key={n.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={async () => {
                                                    // Mark read immediately
                                                    try { await api.post(`/notifications/${n.id}/read`); } catch (_) { }
                                                    setShowNotif(false);
                                                    // Fast, precise navigation
                                                    if (n.type === 'RESOURCE' && n.relatedClassId) {
                                                        const cls = classes.find(c => c.id === n.relatedClassId);
                                                        if (cls) {
                                                            await openClassDetails(cls);
                                                            setActivePage('resources');
                                                            // Pass resource selection to resources pane
                                                            if (n.relatedEntityId) {
                                                                setSelectedResource({ id: n.relatedEntityId });
                                                            }
                                                        } else {
                                                            setActivePage('classes');
                                                        }
                                                    } else if ((n.type === 'ASSIGNMENT' || n.type === 'GRADE') && n.relatedClassId) {
                                                        const cls = classes.find(c => c.id === n.relatedClassId);
                                                        if (cls) {
                                                            await openClassDetails(cls);
                                                            setActivePage('assignments');
                                                        } else {
                                                            setActivePage('classes');
                                                        }
                                                    } else if (n.type === 'JOIN_REQUEST' && n.relatedClassId) {
                                                        const cls = classes.find(c => c.id === n.relatedClassId);
                                                        if (cls) {
                                                            await openClassDetails(cls);
                                                        }
                                                        setActivePage('classes');
                                                    } else {
                                                        setActivePage('classes');
                                                    }
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: 12, color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                        <div><span style={{ fontWeight: 600 }}>{n.type}</span> — {n.message}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, border: '1px solid #eee', background: n.readFlag ? '#f9fafb' : '#dbeafe', color: n.readFlag ? '#666' : '#1e40af' }}>
                                                            {n.readFlag ? 'Read' : 'Unread'}
                                                        </span>
                                                        <button
                                                            className="btn btn--secondary btn--sm"
                                                            title="Copy share link"
                                                            aria-label="Copy share link"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const link = `${window.location.origin}#/notifications/${n.id}`;
                                                                    await navigator.clipboard.writeText(link);
                                                                    setToast({ open: true, type: 'success', message: 'Link copied.' });
                                                                } catch (_) {
                                                                    setToast({ open: true, type: 'error', message: 'Failed to copy link.' });
                                                                }
                                                            }}
                                                        >Copy Link</button>
                                                        {/* No per-item mark read; clicking item navigates to Classes */}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between' }}>
                                        <button className="btn btn--secondary btn--sm" onClick={async () => {
                                            if (notifPage <= 0) return;
                                            try {
                                                const prevPage = Math.max(0, notifPage - 1);
                                                const res = await api.get(`/notifications/user/${user.id}`, { params: { page: prevPage, size: notifPageSize } });
                                                setNotifItems(res.data || []);
                                                setNotifPage(prevPage);
                                            } catch (_) { }
                                        }} disabled={notifPage <= 0}>Prev</button>
                                        <button className="btn btn--secondary btn--sm" onClick={async () => {
                                            try {
                                                const nextPage = notifPage + 1;
                                                const res = await api.get(`/notifications/user/${user.id}`, { params: { page: nextPage, size: notifPageSize } });
                                                const data = res.data || [];
                                                if (data.length > 0) {
                                                    setNotifItems(data);
                                                    setNotifPage(nextPage);
                                                }
                                            } catch (_) { }
                                        }}>Next</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </span>
                    <button type="button" className="nav-profile" title={displayName} aria-label="Open profile" onClick={() => { setShowNotif(false); setActivePage("profile"); }}>
                        <div className="avatar-circle">{(displayName || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                        <div className="profile-lines">
                            <span className="name">{displayName}</span>
                            <span className="meta">{user?.email || ""}{user?.role ? ` • ${user.role}` : ""}</span>
                        </div>
                    </button>
                    <button className="icon-button" title="Logout" aria-label="Logout" onClick={handleLogout}>
                        <img src={logoutPng} alt="Logout" style={{ width: 18, height: 18 }} />
                    </button>
                </div>
            </nav>

            <div className="main-body">
                <aside className="sidebar">
                    <button
                        className={`sidebar-button ${activePage === "classes" ? "active" : ""}`}
                        onClick={() => setActivePage("classes")}
                    >
                        <img src={classesIcon} alt="Classes" /> My Classes
                    </button>

                    <button
                        className={`sidebar-button ${activePage === "resources" ? "active" : ""}`}
                        onClick={() => setActivePage("resources")}
                    >
                        <img src={submissionsIcon} alt="Resources" /> Resources
                    </button>

                    <button
                        className={`sidebar-button ${activePage === "assignments" ? "active" : ""}`}
                        onClick={() => setActivePage("assignments")}
                    >
                        <img src={notificationsIcon} alt="Assignments" /> Assignments
                    </button>
                </aside>

                <main className="main-content">
                    {activePage === "notifications" && (
                        <div>
                            <h2>Notifications</h2>
                            <div className="card" style={{ maxWidth: 640 }}>
                                <div className="card-body">
                                    <TeacherNotifications userId={user?.id} />
                                </div>
                            </div>
                        </div>
                    )}
                    {activePage === "profile" && (
                        <div>
                            <h2>Profile</h2>
                            <div className="card" style={{ maxWidth: 680 }}>
                                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 16, alignItems: 'center' }}>
                                    <div className="avatar-circle" aria-hidden style={{ width: 56, height: 56, fontSize: 18 }}>{(displayName || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 18 }}>{displayName}</div>
                                        <div style={{ color: '#555', fontSize: 14 }}>{user?.email}</div>
                                        <div style={{ marginTop: 6 }}>
                                            <span className="chip chip--success" style={{ marginRight: 8 }}>{user?.role || 'USER'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn--secondary btn--md" onClick={() => setActivePage('classes')}>Back to Dashboard</button>
                                        <button className="btn btn--primary btn--md" onClick={handleLogout}>Logout</button>
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ maxWidth: 680, marginTop: 12 }}>
                                <div className="card-body">
                                    <h3 style={{ marginTop: 0 }}>Account Details</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 10 }}>
                                        <div className="input-label">Name</div><div>{displayName}</div>
                                        <div className="input-label">Email</div><div>{user?.email || '-'}</div>
                                        <div className="input-label">Role</div><div>{user?.role || '-'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ maxWidth: 680, marginTop: 12 }}>
                                <div className="card-body">
                                    <h3 style={{ marginTop: 0 }}>Classes You Teach</h3>
                                    {classes && classes.length > 0 ? (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {classes.map(c => (
                                                <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                                    <strong>{c.name}</strong> — {c.subject}{c.section ? ` • ${c.section}` : ''} (Code: {c.classCode})
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ color: '#666' }}>You have no classes yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activePage === "classes" && (
                        <div className="classes-section">
                            <div className="section-header">
                                <h2><BookOpen size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} /> My Classes</h2>
                                <Button variant="primary" onClick={() => setShowCreateClass(true)}>
                                    <Plus size={20} /> Create New Class
                                </Button>
                            </div>
                            {showCreateClass && (
                                <div className="modal-overlay" role="presentation" onClick={() => setShowCreateClass(false)}>
                                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-class-title" onClick={(e) => e.stopPropagation()}>
                                        <h3 id="create-class-title">Create New Class</h3>
                                        <form onSubmit={createClass}>
                                            <Input label="Class Name" placeholder="Physics 101" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} required autoFocus />
                                            <Input label="Subject" placeholder="Physics" value={newClass.subject} onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })} required />
                                            <Input label="Section" placeholder="A" value={newClass.section} onChange={(e) => setNewClass({ ...newClass, section: e.target.value })} />
                                            <div className="input-group">
                                                <label className="input-label">Description (optional)</label>
                                                <textarea className="input" placeholder="Course overview, expectations, etc." value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} />
                                            </div>
                                            <div className="modal-actions" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                                <Button type="submit" variant="primary">Create</Button>
                                                <Button type="button" variant="secondary" onClick={() => setShowCreateClass(false)} aria-label="Close create class dialog">Cancel</Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="classes-grid">
                                {classes.length === 0 ? (
                                    <p>No classes yet. Create your first one!</p>
                                ) : (
                                    classes.map((cls) => (
                                        <div key={cls.id} className="class-card">
                                            <Card title={cls.name} subtitle={`Subject: ${cls.subject} • Section ${cls.section || "N/A"}`} actions={
                                                <div className="card-actions">
                                                    <Button variant="secondary" onClick={() => openClassDetails(cls)}>View Details</Button>
                                                    <Button variant="danger" onClick={() => deleteClass(cls.id)}><Trash2 size={16} /></Button>
                                                </div>
                                            }>
                                                <p className="class-code">Code: <strong>{cls.classCode}</strong></p>
                                                <p className="desc">{cls.description || "No description"}</p>
                                            </Card>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activePage === "resources" && (
                        <div>
                            {!selectedClass && (
                                <div className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
                                    <div className="card-body">
                                        <h3 style={{ marginTop: 0 }}>Select a class to manage resources</h3>
                                        <div className="input-group">
                                            <label className="input-label">Choose Class</label>
                                            <select className="input" onChange={(e) => {
                                                const id = Number(e.target.value);
                                                const cls = classes.find(c => c.id === id);
                                                if (cls) openClassDetails(cls);
                                            }}>
                                                <option value="">-- Select --</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} • {c.subject}{c.section ? ` • ${c.section}` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-hint">Or use "View Details" in My Classes to open the right panel.</div>
                                    </div>
                                </div>
                            )}
                            <TeacherResources selectedClass={selectedClass} onReload={() => selectedClass && openClassDetails(selectedClass)} selectedResource={selectedResource} onCloseResource={() => setSelectedResource(null)} />
                        </div>
                    )}

                    {activePage === "assignments" && (
                        <div>
                            {!selectedClass && (
                                <div className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
                                    <div className="card-body">
                                        <h3 style={{ marginTop: 0 }}>Select a class to create assignments</h3>
                                        <div className="input-group">
                                            <label className="input-label">Choose Class</label>
                                            <select className="input" onChange={(e) => {
                                                const id = Number(e.target.value);
                                                const cls = classes.find(c => c.id === id);
                                                if (cls) openClassDetails(cls);
                                            }}>
                                                <option value="">-- Select --</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} • {c.subject}{c.section ? ` • ${c.section}` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-hint">Or use "View Details" in My Classes.</div>
                                    </div>
                                </div>
                            )}
                            {selectedClass && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h3 style={{ margin: 0 }}>Assignments for {selectedClass.name}</h3>
                                        <button className="btn btn--secondary btn--md" onClick={() => setSelectedClass(null)} aria-label="Back to class selection">Back</button>
                                    </div>
                                    <div className="class-list">
                                        {selectedClass.assignments.length === 0 ? (
                                            <p>No assignments yet.</p>
                                        ) : (
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {selectedClass.assignments.map((a) => (
                                                    <li key={a.id} style={{ marginBottom: 12 }}>
                                                        <Card title={a.title} subtitle={`Due ${a.deadline ? new Date(a.deadline).toLocaleString() : '—'}`} actions={
                                                            <div className="card-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                <Button variant="secondary" onClick={async () => {
                                                                    try {
                                                                        const res = await api.get(`/assignments/${a.id}/submissions/all`);
                                                                        const list = res.data || [];
                                                                        const grade = prompt(`There are ${list.length} submissions. Enter 'open' to view in console, or enter 'submissionId:grade:feedback' to grade one.`);
                                                                        if (grade && grade !== 'open') {
                                                                            const [sidStr, gStr, ...fbParts] = grade.split(':');
                                                                            const sid = Number(sidStr);
                                                                            const g = Number(gStr);
                                                                            const fb = fbParts.join(':');
                                                                            await api.post(`/assignments/submissions/${sid}/grade`, { grade: g, feedback: fb });
                                                                            alert('Graded submission.');
                                                                        } else if (grade === 'open') {
                                                                            console.table(list);
                                                                        }
                                                                    } catch (e) {
                                                                        alert('Failed to load submissions');
                                                                    }
                                                                }}>View Submissions</Button>
                                                                <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer' }}>
                                                                    Upload/Replace Attachment
                                                                    <input type="file" style={{ display: 'none' }} onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        const fd = new FormData();
                                                                        fd.append('file', file);
                                                                        try {
                                                                            await api.post(`/assignments/${a.id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                            await openClassDetails(selectedClass);
                                                                            setToast({ open: true, type: 'success', message: 'Attachment updated.' });
                                                                        } catch (_) {
                                                                            setToast({ open: true, type: 'error', message: 'Failed to update attachment.' });
                                                                        }
                                                                    }} />
                                                                </label>
                                                                <Button variant="secondary" onClick={async () => {
                                                                    const newTitle = prompt('Update title', a.title || '');
                                                                    const newDesc = prompt('Update description', a.description || '');
                                                                    const newDeadline = prompt('Update deadline (ISO or MM/dd/yyyy HH:mm)', a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '');
                                                                    try {
                                                                        await api.put(`/assignments/${a.id}`, { title: newTitle, description: newDesc, deadline: newDeadline });
                                                                        await openClassDetails(selectedClass);
                                                                        setToast({ open: true, type: 'success', message: 'Assignment updated.' });
                                                                    } catch (e) {
                                                                        setToast({ open: true, type: 'error', message: 'Failed to update assignment.' });
                                                                    }
                                                                }}>Edit</Button>
                                                                <Button variant="danger" onClick={async () => {
                                                                    if (!window.confirm('Delete this assignment?')) return;
                                                                    try {
                                                                        await api.delete(`/assignments/${a.id}`);
                                                                        await openClassDetails(selectedClass);
                                                                        setToast({ open: true, type: 'success', message: 'Assignment deleted.' });
                                                                    } catch (e) {
                                                                        setToast({ open: true, type: 'error', message: 'Failed to delete assignment.' });
                                                                    }
                                                                }}>Delete</Button>
                                                            </div>
                                                        }>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 8 }}>
                                                                <div className="input-label">Description</div><div>{a.description || '—'}</div>
                                                                <div className="input-label">Attachment</div><div>{a.attachmentUrl ? <a href={a.attachmentUrl} target="_blank" rel="noreferrer">{a.attachmentFileName || 'Download'}</a> : '—'}</div>
                                                            </div>
                                                        </Card>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <h4>Create Assignment</h4>
                                    <form onSubmit={postAssignment} aria-label="Create an assignment">
                                        <Input label="Title" placeholder="Quiz 1" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} required />
                                        <div className="input-group">
                                            <label className="input-label">Description</label>
                                            <textarea className="input" placeholder="Instructions, points, rubric (optional)" value={assignForm.description} onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} />
                                            <div className="input-hint">Optional: add grading criteria or references.</div>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="deadline">Deadline</label>
                                            <Input id="deadline" type="datetime-local" value={assignForm.deadline} onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })} required />
                                            <div className="input-hint">Use local date/time format; students see due time in their locale.</div>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="assignment-attachment">Attachment (optional)</label>
                                            <input id="assignment-attachment" className="input" type="file" onChange={(e) => setAssignFile(e.target.files[0])} />
                                            <div className="input-hint">Attach instructions or rubric (PDF, DOCX, etc.).</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Button type="submit" variant="primary">Create</Button>
                                            <Button type="button" variant="secondary" onClick={() => setAssignForm({ title: "", description: "", deadline: "" })}>Clear</Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </main>

                {/* Details Panel (Right Docked Modal) only in My Classes */}
                {activePage === "classes" && selectedClass && (
                    <div className="class-details-modal" role="dialog" aria-modal="true" aria-labelledby="class-details-title">
                        <button className="close-details-btn" onClick={() => setSelectedClass(null)} aria-label="Close details panel">
                            Close Details
                        </button>

                        <h4 id="class-details-title">{selectedClass.name}</h4>
                        <div className="info">
                            <p><strong>Code:</strong> {selectedClass.classCode}</p>
                            <p><strong>Subject:</strong> {selectedClass.subject} • {selectedClass.section}</p>
                        </div>

                        <section>
                            <h4>Pending Join Requests ({selectedClass.pendingRequests.length})</h4>
                            {selectedClass.pendingRequests.length === 0 ? (
                                <p>No pending requests</p>
                            ) : (
                                <ul>
                                    {selectedClass.pendingRequests.map((req) => (
                                        <li key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                                            <span>{req.student.fullName} ({req.student.email})</span>
                                            <div>
                                                <button onClick={() => handleJoinRequest(req.id, "approve")} className="btn-success" style={{ marginRight: 8 }}>
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button onClick={() => handleJoinRequest(req.id, "reject")} className="btn-danger">
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section>
                            <h4><Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Enrolled Students ({selectedClass.students.length})</h4>
                            <ul>
                                {selectedClass.students.map((s) => (
                                    <li key={s.id}>{s.fullName} • {s.email}</li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h4>Activity Logs</h4>
                            <TeacherActivityLogs classId={selectedClass.id} />
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

// Lightweight resources pane matching FRS; backend endpoints needed for full CRUD
function TeacherResources({ selectedClass, onReload, selectedResource, onCloseResource }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null);
    const [link, setLink] = useState("");
    const [description, setDescription] = useState("");
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState(null);

    useEffect(() => {
        const load = async () => {
            if (!selectedClass) return;
            try {
                setLoading(true);
                const res = await api.get(`/resources/class/${selectedClass.id}/paged`, { params: { page, size } });
                const data = res.data;
                if (data && Array.isArray(data.content)) {
                    setItems(data.content);
                    setTotalPages(data.totalPages || 0);
                } else {
                    setItems([]);
                    setTotalPages(0);
                }
            } catch (e) {
                setItems([]);
                setTotalPages(0);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedClass, page, size]);

    const uploadResource = async (e) => {
        e.preventDefault();
        if (!selectedClass) return;
        try {
            // Support either file upload or link-only resource
            if (file) {
                const fd = new FormData();
                fd.append("title", title);
                fd.append("file", file);
                if (description) fd.append("description", description);
                await api.post(`/resources/class/${selectedClass.id}/upload`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else if (link) {
                await api.post(`/resources/class/${selectedClass.id}/link`, { title, url: link, description });
            }
            setTitle("");
            setFile(null);
            setLink("");
            setDescription("");
            // Refresh current page
            onReload?.();
            setToast({ open: true, type: 'success', message: 'Resource saved.' });
        } catch (e) {
            setToast({ open: true, type: 'error', message: 'Upload failed.' });
        }
    };

    const deleteResource = async (id) => {
        try {
            await api.delete(`/resources/${id}`);
            onReload?.();
            setToast({ open: true, type: 'success', message: 'Resource deleted.' });
        } catch (e) {
            setToast({ open: true, type: 'error', message: 'Delete failed.' });
        }
    };

    if (!selectedClass) return <p>Select a class to manage resources.</p>;

    return (
        <div>
            <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
            <h3>Resources for {selectedClass.name}</h3>
            <form onSubmit={uploadResource} style={{ marginBottom: 12 }} aria-label="Upload or link a resource">
                <Input label="Title" placeholder="Lecture 1 Slides" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <div className="input-group">
                    <label className="input-label" htmlFor="resource-file">File (optional)</label>
                    <input id="resource-file" className="input" type="file" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <Input label="Link (optional)" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
                <div className="input-group">
                    <label className="input-label">Description (optional)</label>
                    <textarea className="input" placeholder="Brief description of the resource" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button type="submit" variant="primary">Upload</Button>
                    <Button type="button" variant="secondary" onClick={() => { setTitle(""); setFile(null); setLink(""); }}>Clear</Button>
                </div>
            </form>
            <div className="class-list">
                {loading && <div style={{ padding: 12, color: '#666' }}>Loading…</div>}
                {items.map((r) => (
                    <Card key={r.id} title={r.title} subtitle={r.url ? r.url : "Uploaded file"} actions={
                        <div className="card-actions">
                            <button className="nav-button" style={{ padding: 6 }} onClick={() => { setDetailItem(r); setDetailOpen(true); }}>Open</button>
                            {(() => {
                                const name = (r.fileName || '').toLowerCase();
                                const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');
                                const src = r.url ? r.url : (selectedClass ? `/uploads/class-${selectedClass.id}/${r.fileName}` : null);
                                if (isExcel && src) {
                                    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(src)}`;
                                    return <a href={officeUrl} target="_blank" rel="noreferrer" className="nav-button" style={{ padding: 6 }}>Open in Office Online</a>;
                                }
                                return null;
                            })()}
                            <Button variant="danger" onClick={() => deleteResource(r.id)}><Trash2 size={14} /></Button>
                        </div>
                    }>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={16} />
                            <span>{r.title}</span>
                        </div>
                    </Card>
                ))}
                {items.length === 0 && <p>No resources yet.</p>}
            </div>
            {detailOpen && detailItem && (
                <div className="modal-overlay" role="presentation" onClick={() => setDetailOpen(false)}>
                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="resource-detail-title" onClick={(e) => e.stopPropagation()}>
                        <h3 id="resource-detail-title">{detailItem.title}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 10 }}>
                            <div className="input-label">Title</div><div>{detailItem.title}</div>
                            <div className="input-label">File</div><div>{detailItem.fileName || '-'}</div>
                            <div className="input-label">Link</div><div>{detailItem.url ? <a href={detailItem.url} target="_blank" rel="noreferrer">{detailItem.url}</a> : '-'}</div>
                            <div className="input-label">Description</div><div>{detailItem.description || '-'}</div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            {detailItem.fileName && (() => {
                                const fname = detailItem.fileName.toLowerCase();
                                const src = `/uploads/class-${selectedClass.id}/${detailItem.fileName}`;
                                if (fname.endsWith('.png') || fname.endsWith('.jpg') || fname.endsWith('.jpeg')) {
                                    return <img src={src} alt={detailItem.title} style={{ maxWidth: '100%', borderRadius: 8 }} />;
                                }
                                if (fname.endsWith('.pdf')) {
                                    return <iframe title="PDF preview" src={src} style={{ width: '100%', height: 480, border: '1px solid #eee', borderRadius: 8 }} />;
                                }
                                if (fname.endsWith('.xlsx') || fname.endsWith('.xls')) {
                                    const src = `/uploads/class-${selectedClass.id}/${detailItem.fileName}`;
                                    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(src)}`;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span>Excel Document</span>
                                            <a href={officeUrl} target="_blank" rel="noreferrer" className="nav-button">Open in Office Online</a>
                                            <a href={src} download className="nav-button">Download</a>
                                        </div>
                                    );
                                }
                                return <div className="input-hint">Unsupported inline preview. Open the link above.</div>;
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
            {selectedClass && selectedResource && !detailOpen && items.length > 0 && (() => {
                const match = items.find(it => it.id === selectedResource.id);
                if (match) {
                    setDetailItem(match);
                    setDetailOpen(true);
                    onCloseResource?.();
                }
                return null;
            })()}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <button className="btn btn--secondary btn--md" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
                    <span style={{ fontSize: 12, color: '#666' }}>Page {page + 1} / {totalPages}</span>
                    <button className="btn btn--secondary btn--md" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next</button>
                    <select className="input" style={{ width: 84 }} value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }}>
                        {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                    </select>
                </div>
            )}
        </div>
    );
}
function TeacherNotifications({ userId }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const load = async () => {
            if (!userId) return;
            try {
                const res = await api.get(`/notifications/user/${userId}`);
                setItems(res.data || []);
            } catch (e) {
                setItems([]);
            }
        };
        load();
    }, [userId]);

    if (!userId) return <p>Loading...</p>;
    if (items.length === 0) return <p>No new notifications.</p>;

    return (
        <ul>
            {items.map((n) => (
                <li key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 600 }}>{n.type}</span> — {n.message}
                    <span style={{ color: '#888', marginLeft: 8 }}>{new Date(n.createdAt).toLocaleString()}</span>
                </li>
            ))}
        </ul>
    );
}

function TeacherActivityLogs({ classId }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const size = 20;
    useEffect(() => {
        const load = async () => {
            if (!classId) return;
            try {
                const res = await api.get(`/activity-logs/class/${classId}`, { params: { page, size } });
                setItems(res.data?.content || []);
            } catch (e) {
                setItems([]);
            }
        };
        load();
    }, [classId, page]);
    if (!classId) return null;
    return (
        <div className="card" style={{ marginTop: 8 }}>
            <div className="card-body">
                {items.length === 0 ? (
                    <p>No recent activity.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {items.map((it) => (
                            <li key={it.id} style={{ padding: '6px 0', borderBottom: '1px dotted #eee' }}>
                                <span style={{ fontSize: 12, color: '#666' }}>{new Date(it.createdAt).toLocaleString()}</span>
                                <div><strong>{it.type}</strong> — {it.message}</div>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn--secondary btn--sm" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
                    <button className="btn btn--secondary btn--sm" onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}