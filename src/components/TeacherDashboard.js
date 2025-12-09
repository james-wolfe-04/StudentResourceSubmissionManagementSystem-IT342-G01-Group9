import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import "./styles/TeacherDashboard.css"; // Create this or reuse StudentDashboard.css

// Icons (replace with your actual paths or use heroicons/fontawesome)
import { Home, BookOpen, Users, FileText, LogOut, Plus, X, Check, Trash2 } from "lucide-react";

export default function TeacherDashboard({ user, onLogout }) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState("classes"); // Default to classes
    const [selectedClass, setSelectedClass] = useState(null);

    // Form states
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClass, setNewClass] = useState({ name: "", subject: "", section: "", description: "" });

    const [assignForm, setAssignForm] = useState({ title: "", description: "", deadline: "" });
    const [assignFile, setAssignFile] = useState(null);

    // Fetch teacher's classes on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        if (user?.id) {
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/classes/teacher/${user.id}`);
            setClasses(res.data || []);
        } catch (err) {
            console.error("Failed to fetch classes:", err);
            alert("Failed to load classes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const createClass = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/classes", {
                ...newClass,
                teacherId: user.id
            });
            setNewClass({ name: "", subject: "", section: "", description: "" });
            setShowCreateClass(false);
            fetchClasses();
        } catch (err) {
            console.error(err);
            alert("Failed to create class");
        }
    };

    const deleteClass = async (classId) => {
        if (!window.confirm("Delete this class permanently?")) return;
        try {
            await axios.delete(`/classes/${classId}`);
            fetchClasses();
            if (selectedClass?.id === classId) setSelectedClass(null);
        } catch (err) {
            alert("Failed to delete class");
        }
    };

    const openClassDetails = async (cls) => {
        try {
            const [studentsRes, assignmentsRes, requestsRes] = await Promise.all([
                axios.get(`/classes/${cls.id}/students`),
                axios.get(`/classes/${cls.id}/assignments`),
                axios.get(`/classes/${cls.id}/join-requests`) // Backend must expose this
            ]);

            setSelectedClass({
                ...cls,
                students: studentsRes.data.students || [],
                pendingRequests: requestsRes.data || [],
                assignments: assignmentsRes.data || []
            });
        } catch (err) {
            console.error(err);
            alert("Failed to load class details");
        }
    };

    const handleJoinRequest = async (requestId, action) => {
        try {
            await axios.post(`/join-requests/${requestId}/${action}`); // approve or reject
            openClassDetails(selectedClass);
        } catch (err) {
            alert(`Failed to ${action} request`);
        }
    };

    const postAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", assignForm.title);
        formData.append("description", assignForm.description);
        formData.append("deadline", assignForm.deadline);
        formData.append("classId", selectedClass.id);
        if (assignFile) formData.append("file", assignFile);

        try {
            await axios.post("/assignments", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setAssignForm({ title: "", description: "", deadline: "" });
            setAssignFile(null);
            openClassDetails(selectedClass);
        } catch (err) {
            alert("Failed to post assignment");
        }
    };

    if (loading) {
        return <div className="loading">Loading your classes...</div>;
    }

    return (
        <div className="teacher-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Teacher Dashboard</h1>
                    <p>Welcome back, <strong>{user?.fullName}</strong>!</p>
                </div>
                <button onClick={onLogout} className="logout-btn">
                    <LogOut size={20} /> Logout
                </button>
            </header>

            <div className="dashboard-body">
                {/* Sidebar */}
                <aside className="sidebar">
                    <button
                        className={activePage === "classes" ? "active" : ""}
                        onClick={() => setActivePage("classes")}
                    >
                        <BookOpen size={20} /> My Classes
                    </button>
                    {/* Add more menu items later */}
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {activePage === "classes" && (
                        <div className="classes-section">
                            <div className="section-header">
                                <h2>My Classes</h2>
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowCreateClass(true)}
                                >
                                    <Plus size={20} /> Create New Class
                                </button>
                            </div>

                            {/* Create Class Modal/Form */}
                            {showCreateClass && (
                                <div className="modal-overlay">
                                    <div className="modal">
                                        <h3>Create New Class</h3>
                                        <form onSubmit={createClass}>
                                            <input
                                                placeholder="Class Name (e.g. Physics 101)"
                                                value={newClass.name}
                                                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                                required
                                            />
                                            <input
                                                placeholder="Subject"
                                                value={newClass.subject}
                                                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                                                required
                                            />
                                            <input
                                                placeholder="Section (e.g. A)"
                                                value={newClass.section}
                                                onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                            />
                                            <textarea
                                                placeholder="Description (optional)"
                                                value={newClass.description}
                                                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                                            />
                                            <div className="modal-actions">
                                                <button type="submit" className="btn-primary">Create</button>
                                                <button type="button" onClick={() => setShowCreateClass(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Classes Grid */}
                            <div className="classes-grid">
                                {classes.length === 0 ? (
                                    <p>No classes yet. Create your first one!</p>
                                ) : (
                                    classes.map((cls) => (
                                        <div key={cls.id} className="class-card">
                                            <h3>{cls.name}</h3>
                                            <p><strong>Subject:</strong> {cls.subject} • Section {cls.section || "N/A"}</p>
                                            <p className="class-code">Code: <strong>{cls.classCode}</strong></p>
                                            <p className="desc">{cls.description || "No description"}</p>
                                            <div className="card-actions">
                                                <button onClick={() => openClassDetails(cls)} className="btn-view">
                                                    View Details
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)} className="btn-danger">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Class Details Panel (Right Sidebar) */}
                {selectedClass && (
                    <aside className="details-panel">
                        <div className="panel-header">
                            <h3>{selectedClass.name}</h3>
                            <button onClick={() => setSelectedClass(null)}><X size={24} /></button>
                        </div>

                        <div className="info">
                            <p><strong>Code:</strong> {selectedClass.classCode}</p>
                            <p><strong>Subject:</strong> {selectedClass.subject} • {selectedClass.section}</p>
                        </div>

                        {/* Pending Requests */}
                        <section>
                            <h4>Pending Join Requests ({selectedClass.pendingRequests.length})</h4>
                            {selectedClass.pendingRequests.length === 0 ? (
                                <p>No pending requests</p>
                            ) : (
                                <ul className="request-list">
                                    {selectedClass.pendingRequests.map((req) => (
                                        <li key={req.id}>
                                            <span>{req.student.fullName} ({req.student.email})</span>
                                            <div>
                                                <button onClick={() => handleJoinRequest(req.id, "approve")} className="btn-success">
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

                        {/* Enrolled Students */}
                        <section>
                            <h4>Enrolled Students ({selectedClass.students.length})</h4>
                            <ul>
                                {selectedClass.students.map((s) => (
                                    <li key={s.id}>{s.fullName} • {s.email}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Assignments */}
                        <section>
                            <h4>Assignments</h4>
                            <ul>
                                {selectedClass.assignments.map((a) => (
                                    <li key={a.id}>
                                        <strong>{a.title}</strong><br />
                                        Due: {new Date(a.deadline).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Post New Assignment */}
                        <section>
                            <h4>Post New Assignment</h4>
                            <form onSubmit={postAssignment}>
                                <input
                                    placeholder="Title"
                                    value={assignForm.title}
                                    onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={assignForm.description}
                                    onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                                />
                                <input
                                    type="datetime-local"
                                    value={assignForm.deadline}
                                    onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                                    required
                                />
                                <input type="file" onChange={(e) => setAssignFile(e.target.files[0])} />
                                <button type="submit" className="btn-primary">Post Assignment</button>
                            </form>
                        </section>
                    </aside>
                )}
            </div>
        </div>
    );
}