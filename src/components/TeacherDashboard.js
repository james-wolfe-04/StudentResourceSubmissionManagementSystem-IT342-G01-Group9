import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
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

export default function TeacherDashboard({ user, onLogout }) {
    const [activePage, setActivePage] = useState("classes");
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClass, setNewClass] = useState({ name: "", subject: "", section: "", description: "" });

    const [selectedClass, setSelectedClass] = useState(null);
    const [assignForm, setAssignForm] = useState({ title: "", description: "", deadline: "" });

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

    useEffect(() => {
        if (user?.id) {
            loadClasses();
            // Load unread notifications count
            (async () => {
                try {
                    const res = await api.get(`/notifications/user/${user.id}`);
                    const items = res.data || [];
                    setNotifItems(items);
                    setNotifCount(items.filter(n => !n.readFlag).length);
                } catch (_) {
                    setNotifItems([]);
                    setNotifCount(0);
                }
            })();
        }
    }, [user?.id, loadClasses]);

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
            // Attempt delete if backend adds it; otherwise show message
            await api.delete(`/classes/${classId}`);
            if (selectedClass?.id === classId) setSelectedClass(null);
            loadClasses();
        } catch (e) {
            alert("Delete class is not yet available in backend.");
        }
    };

    const openClassDetails = async (cls) => {
        try {
            const [assignmentsRes, requestsRes, studentsRes] = await Promise.all([
                api.get(`/assignments/class/${cls.id}`),
                api.get(`/classes/${cls.id}/join-requests`),
                api.get(`/classes/${cls.id}/students`),
            ]);
            setSelectedClass({
                ...cls,
                students: studentsRes.data || [],
                assignments: assignmentsRes.data || [],
                pendingRequests: requestsRes.data || [],
            });
        } catch (e) {
            console.error(e);
            alert("Failed to load class details");
        }
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
            await api.post("/assignments/create", {
                title: assignForm.title,
                description: assignForm.description,
                deadline: assignForm.deadline,
                classId: selectedClass.id,
            });
            setAssignForm({ title: "", description: "", deadline: "" });
            openClassDetails(selectedClass);
        } catch (e) {
            alert("Failed to post assignment");
        }
    };

    if (loading) return <div className="loading">Loading your classes...</div>;

    return (
        <div className="dashboard-container">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="nav-left">
                    <img src={logo} alt="Logo" className="logo" />
                    <h2>Teacher Dashboard</h2>
                </div>
                <div className="nav-right">
                    <button className="icon-button" title="Notifications" aria-label="Open notifications" onClick={async () => {
                        try {
                            const res = await api.get(`/notifications/user/${user.id}`);
                            const items = res.data || [];
                            setNotifItems(items);
                            setNotifCount(items.filter(n => !n.readFlag).length);
                        } catch (_) {
                            setNotifItems([]);
                            setNotifCount(0);
                        }
                        setShowNotif(v => !v);
                    }} style={{ position: 'relative' }}>
                        <img src={notifPng} alt="Notifications" style={{ width: 18, height: 18 }} />
                        {notifCount > 0 && <span className="notif-badge" aria-label={`${notifCount} unread notifications`}>{notifCount}</span>}
                    </button>
                    {showNotif && (
                        <div role="dialog" aria-label="Notifications" style={{ position: 'absolute', right: 12, top: 56, width: 360, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}>
                            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                <strong>Notifications</strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button className="btn btn--secondary btn--md" onClick={async () => {
                                        try {
                                            const res = await api.get(`/notifications/user/${user.id}`);
                                            const items = res.data || [];
                                            setNotifItems(items);
                                            setNotifCount(items.filter(n => !n.readFlag).length);
                                        } catch (_) { }
                                    }}>Refresh</button>
                                    {notifItems.some(n => !n.readFlag) && (
                                        <button className="btn btn--primary btn--md" onClick={async () => {
                                            try {
                                                const unread = notifItems.filter(n => !n.readFlag);
                                                await Promise.all(unread.map(n => api.post(`/notifications/${n.id}/read`)));
                                                const next = notifItems.map(n => ({ ...n, readFlag: true }));
                                                setNotifItems(next);
                                                setNotifCount(0);
                                            } catch (_) { }
                                        }}>Mark all read</button>
                                    )}
                                    <button className="icon-button" aria-label="Close notifications" onClick={() => setShowNotif(false)}>×</button>
                                </div>
                            </div>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {notifItems.length === 0 ? (
                                    <div style={{ padding: 16, color: '#666' }}>No new notifications.</div>
                                ) : (
                                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                        {notifItems.map(n => (
                                            <li key={n.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 12, color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                                    <div><span style={{ fontWeight: 600 }}>{n.type}</span> — {n.message}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, border: '1px solid #eee', background: n.readFlag ? '#f9fafb' : '#dbeafe', color: n.readFlag ? '#666' : '#1e40af' }}>
                                                        {n.readFlag ? 'Read' : 'Unread'}
                                                    </span>
                                                    {!n.readFlag && (
                                                        <button className="btn btn--secondary btn--md" onClick={async () => {
                                                            try {
                                                                await api.post(`/notifications/${n.id}/read`);
                                                                const next = notifItems.map(x => x.id === n.id ? { ...x, readFlag: true } : x);
                                                                setNotifItems(next);
                                                                setNotifCount(next.filter(i => !i.readFlag).length);
                                                            } catch (_) { }
                                                        }}>Mark read</button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                    <button type="button" className="nav-profile" title={user?.email || "Profile"} aria-label="Open profile" onClick={() => setActivePage("profile")}>
                        <div className="avatar-circle">{(user?.fullName || user?.name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                        <div className="profile-lines">
                            <span className="name">{user?.fullName || user?.name || "User"}</span>
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
                            <div className="card" style={{ maxWidth: 520 }}>
                                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar-circle" aria-hidden>{(user?.fullName || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{user?.fullName}</div>
                                        <div style={{ color: '#555', fontSize: 14 }}>{user?.email}{user?.role ? ` • ${user.role}` : ""}</div>
                                    </div>
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
                            {selectedClass && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h3 style={{ margin: 0 }}>Resources for {selectedClass.name}</h3>
                                    <button className="btn btn--secondary btn--md" onClick={() => setSelectedClass(null)} aria-label="Back to class selection">Back</button>
                                </div>
                            )}
                            <TeacherResources selectedClass={selectedClass} onReload={() => selectedClass && openClassDetails(selectedClass)} />
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
                                    <ul>
                                        {selectedClass.assignments.map((a) => (
                                            <li key={a.id} style={{ marginBottom: 12 }}>
                                                <strong>{a.title}</strong> • Due {new Date(a.deadline).toLocaleString()}
                                            </li>
                                        ))}
                                    </ul>
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
                    </div>
                )}
            </div>
        </div>
    );
}

// Lightweight resources pane matching FRS; backend endpoints needed for full CRUD
function TeacherResources({ selectedClass, onReload }) {
    const [items, setItems] = useState([]);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null);
    const [link, setLink] = useState("");

    useEffect(() => {
        const load = async () => {
            if (!selectedClass) return;
            try {
                // Placeholder: waiting for backend GET /api/resources/class/{classId}
                const res = await api.get(`/resources/class/${selectedClass.id}`);
                setItems(res.data || []);
            } catch (e) {
                setItems([]);
            }
        };
        load();
    }, [selectedClass]);

    const uploadResource = async (e) => {
        e.preventDefault();
        if (!selectedClass) return;
        try {
            // Support either file upload or link-only resource
            if (file) {
                const fd = new FormData();
                fd.append("title", title);
                fd.append("file", file);
                await api.post(`/resources/class/${selectedClass.id}/upload`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else if (link) {
                await api.post(`/resources/class/${selectedClass.id}/link`, { title, url: link });
            }
            setTitle("");
            setFile(null);
            setLink("");
            onReload?.();
        } catch (e) {
            alert("Upload resource requires backend endpoints.");
        }
    };

    const deleteResource = async (id) => {
        try {
            await api.delete(`/resources/${id}`);
            onReload?.();
        } catch (e) {
            alert("Delete resource requires backend endpoint.");
        }
    };

    if (!selectedClass) return <p>Select a class to manage resources.</p>;

    return (
        <div>
            <h3>Resources for {selectedClass.name}</h3>
            <form onSubmit={uploadResource} style={{ marginBottom: 12 }} aria-label="Upload or link a resource">
                <Input label="Title" placeholder="Lecture 1 Slides" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <div className="input-group">
                    <label className="input-label" htmlFor="resource-file">File (optional)</label>
                    <input id="resource-file" className="input" type="file" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <Input label="Link (optional)" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button type="submit" variant="primary">Upload</Button>
                    <Button type="button" variant="secondary" onClick={() => { setTitle(""); setFile(null); setLink(""); }}>Clear</Button>
                </div>
            </form>
            <div className="class-list">
                {items.map((r) => (
                    <Card key={r.id} title={r.title} subtitle={r.url ? r.url : "Uploaded file"} actions={
                        <div className="card-actions">
                            {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="nav-button" style={{ padding: 6 }}>Open</a>}
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