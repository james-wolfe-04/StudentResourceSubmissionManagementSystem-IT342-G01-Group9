import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { fetchUserNotifications, markAllReadForUser } from "../api/notifications";
import "./styles/StudentDashboard.css";
import classesIcon from "./assets/classes-icon.png";
import submissionsIcon from "./assets/submissions-icon.png";
import logo from "./assets/logo.png";
import Submissions from "./Submissions";
import notifPng from "./assets/notifications-icon.png";
import logoutPng from "./assets/logout-icon.png";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";
import Chip from "./ui/Chip";

export default function Dashboard({ user, onLogout }) {
  const displayName = (() => {
    const name = user?.fullName || user?.name;
    if (name && name.trim().length > 0) return name;
    const email = user?.email || "";
    const local = email.split("@")[0] || "User";
    return local.replace(/\./g, " ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  })();
  const [activePage, setActivePage] = useState("welcome");
  const [classes, setClasses] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null); // APPROVED | PENDING | null
  const [joinError, setJoinError] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifPage, setNotifPage] = useState(0);
  const notifPageSize = 20;
  const [selectedClass, setSelectedClass] = useState(null);
  const [resourceItems, setResourceItems] = useState([]);

  // Load classes when switching to Classes page
  const loadStudentClasses = async () => {
    if (!user?.id) return;
    try {
      setLoadingClasses(true);
      const res = await api.get(`/classes/student/${user.id}`);
      setClasses(res.data || []);
      console.log('[Classes] Loaded classes for student', user.id, res.data || []);
    } catch (e) {
      setClasses([]);
      const msg = e?.response?.data?.message || e?.message || 'Failed to load classes';
      console.error('[Classes] Load error:', msg, e);
    } finally {
      setLoadingClasses(false);
    }
  };

  const onGoClasses = async () => {
    setActivePage("classes");
    loadStudentClasses();
  };
  const loadResourcesForClass = async (cls) => {
    if (!cls) return;
    try {
      const res = await api.get(`/resources/class/${cls.id}`);
      setResourceItems(res.data || []);
    } catch (_) {
      setResourceItems([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    onLogout?.();
  };

  useEffect(() => {
    if (!user?.id) return;
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
    // Deep link handler: support #/notifications/{id}
    const handleHashLink = async () => {
      const hash = window.location.hash || "";
      const m = hash.match(/^#\/notifications\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        try {
          const res = await api.get(`/notifications/${id}`);
          const n = res.data;
          if (!n) return;
          // Mark read optimistically
          try { await api.post(`/notifications/${id}/read`); } catch (_) { }
          // Navigate based on type
          if (n.type === 'RESOURCE' && n.relatedClassId) {
            await onGoClasses();
            setActivePage('resources');
            const cls = classes.find(c => c.id === n.relatedClassId);
            if (cls) {
              setSelectedClass(cls);
              await loadResourcesForClass(cls);
            }
          } else if ((n.type === 'ASSIGNMENT' || n.type === 'GRADE') && n.relatedClassId) {
            await onGoClasses();
            setActivePage('submissions');
          } else {
            setActivePage('classes');
          }
        } catch (_) {
          // ignore if not accessible
        }
      }
    };
    handleHashLink();
  }, [user?.id]);

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <img src={logo} alt="Logo" className="logo" />
          <h2>Student Dashboard</h2>
        </div>
        <div className="nav-right">
          <button className="icon-button" title="Notifications" aria-label="Open notifications" onClick={async () => {
            try {
              await markAllReadForUser(user.id);
              const items = (await fetchUserNotifications(user.id)).map(n => ({ ...n, readFlag: true }));
              setNotifItems(items);
              setNotifCount(0);
              setNotifPage(0);
            } catch (_) {
              // fallback: still open
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
                      const res = await api.get(`/notifications/user/${user.id}`, { params: { page: 0, size: notifPageSize } });
                      const items = res.data || [];
                      setNotifItems(items);
                      setNotifCount(items.filter(n => !n.readFlag).length);
                      setNotifPage(0);
                    } catch (_) { }
                  }}>Refresh</button>
                  {/* Mark-all button removed: reads occur automatically on open */}
                  <button className="icon-button" aria-label="Close notifications" onClick={() => setShowNotif(false)} style={{ color: '#111' }}>×</button>
                </div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifItems.length === 0 ? (
                  <div style={{ padding: 16, color: '#666' }}>No new notifications.</div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {notifItems.map(n => (
                      <li
                        key={n.id}
                        style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={async () => {
                          // Mark as read immediately
                          try { await api.post(`/notifications/${n.id}/read`); } catch (_) { }
                          setShowNotif(false);
                          // Navigate precisely to item
                          if (n.type === 'RESOURCE' && n.relatedClassId) {
                            await onGoClasses();
                            setActivePage('resources');
                            const cls = classes.find(c => c.id === n.relatedClassId);
                            if (cls) {
                              setSelectedClass(cls);
                              await loadResourcesForClass(cls);
                            }
                          } else if ((n.type === 'ASSIGNMENT' || n.type === 'GRADE') && n.relatedClassId) {
                            await onGoClasses();
                            setActivePage('submissions');
                          } else {
                            setActivePage('classes');
                          }
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</div>
                          <div><span style={{ fontWeight: 600 }}>{n.type}</span> — {n.message}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, border: '1px solid #eee', background: n.readFlag ? '#f9fafb' : '#dbeafe', color: n.readFlag ? '#666' : '#1e40af' }}>
                            {n.readFlag ? 'Read' : 'Unread'}
                          </span>
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
          <button type="button" className="nav-profile" title={displayName} aria-label="Open profile" onClick={() => setActivePage("profile")}>
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

      {/* Sidebar + Main Content */}
      <div className="main-body">
        <aside className="sidebar">
          <button
            className={`sidebar-button ${activePage === "welcome" ? "active" : ""}`}
            onClick={() => setActivePage("welcome")}
          >
            <img src={classesIcon} alt="My Classes" /> Dashboard
          </button>

          <button
            className={`sidebar-button ${activePage === "classes" ? "active" : ""}`}
            onClick={onGoClasses}
          >
            <img src={classesIcon} alt="My Classes" /> My Classes
          </button>

          <button
            className={`sidebar-button ${activePage === "submissions" ? "active" : ""}`}
            onClick={() => setActivePage("submissions")}
          >
            <img src={submissionsIcon} alt="Submissions" /> Submissions
          </button>

          {/* Notifications moved to top nav for consistency */}
        </aside>

        <main className="main-content">
          {activePage === "welcome" && <h1>Welcome, {user?.fullName}!</h1>}
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
                  <h3 style={{ marginTop: 0 }}>Your Classes</h3>
                  {classes && classes.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {classes.map(c => (
                        <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                          <strong>{c.name}</strong> — {c.subject}{c.section ? ` • ${c.section}` : ''} (Code: {c.classCode})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: '#666' }}>You are not enrolled in any classes yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activePage === "resources" && (
            <div>
              {!selectedClass && (
                <div className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
                  <div className="card-body">
                    <h3 style={{ marginTop: 0 }}>Select a class to view resources</h3>
                    <div className="input-group">
                      <label className="input-label">Choose Class</label>
                      <select className="input" onChange={async (e) => {
                        const id = Number(e.target.value);
                        const cls = classes.find(c => c.id === id);
                        setSelectedClass(cls || null);
                        if (cls) await loadResourcesForClass(cls);
                      }}>
                        <option value="">-- Select --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} • {c.subject}{c.section ? ` • ${c.section}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-hint">Use Refresh on My Classes if list is empty.</div>
                  </div>
                </div>
              )}

              {selectedClass && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>Resources for {selectedClass.name}</h3>
                    <button className="btn btn--secondary btn--md" onClick={() => { setSelectedClass(null); setResourceItems([]); }}>Back</button>
                  </div>
                  <div className="class-list">
                    {resourceItems.length === 0 ? (
                      <p>No resources yet.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {resourceItems.map(r => (
                          <li key={r.id} style={{ marginBottom: 12 }}>
                            <Card title={r.title} subtitle={r.fileName ? r.fileName : (r.url || '')} actions={
                              <div className="card-actions">
                                {r.url && (
                                  <>
                                    <a href={r.url} target="_blank" rel="noreferrer" className="nav-button" style={{ padding: 6 }}>Open</a>
                                    {(() => {
                                      const name = (r.fileName || '').toLowerCase();
                                      const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');
                                      if (isExcel) {
                                        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(r.url)}`;
                                        return <a href={officeUrl} target="_blank" rel="noreferrer" className="nav-button" style={{ padding: 6 }}>Open in Office Online</a>;
                                      }
                                      return null;
                                    })()}
                                  </>
                                )}
                              </div>
                            }>
                              {(() => {
                                const name = (r.fileName || '').toLowerCase();
                                const isImage = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif');
                                if (isImage && r.url) {
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <img src={r.url} alt={r.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
                                      <a href={r.url} download className="nav-button" style={{ alignSelf: 'flex-start' }}>Download</a>
                                    </div>
                                  );
                                }
                                if (name.endsWith('.pdf') && r.url) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>PDF Document</span>
                                      <a href={r.url} target="_blank" rel="noreferrer" className="nav-button">Open</a>
                                      <a href={r.url} download className="nav-button">Download</a>
                                    </div>
                                  );
                                }
                                if ((name.endsWith('.xls') || name.endsWith('.xlsx')) && r.url) {
                                  const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(r.url)}`;
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>Excel Document</span>
                                      <a href={officeUrl} target="_blank" rel="noreferrer" className="nav-button">Open in Office Online</a>
                                      <a href={r.url} download className="nav-button">Download</a>
                                    </div>
                                  );
                                }
                                if ((name.endsWith('.doc') || name.endsWith('.docx')) && r.url) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>Word Document</span>
                                      <a href={r.url} className="nav-button">Download</a>
                                    </div>
                                  );
                                }
                                // Fallback: show title and open/download if available
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>{r.title}</span>
                                    {r.url && <a href={r.url} className="nav-button">Download</a>}
                                  </div>
                                );
                              })()}
                            </Card>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activePage === "classes" && (
            <div className="classes-section">
              <div className="section-header">
                <h2>My Classes</h2>
              </div>
              <form
                className="join-form"
                aria-label="Join a class by code"
                onSubmit={(e) => { e.preventDefault(); /* handled in Join button */ }}
              >
                <Input
                  placeholder="Enter Class Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <div className="join-actions">
                  <Button type="button" variant="primary" onClick={async () => {
                    const code = joinCode.trim().toUpperCase();
                    setJoinStatus(null);
                    setJoinError(null);
                    if (!code) {
                      const msg = 'Please enter a class code';
                      setJoinError(msg);
                      console.warn('[Join] Missing class code');
                      return;
                    }
                    try {
                      setLoadingClasses(true);
                      const res = await api.post(`/classes/join`, null, { params: { classCode: code, studentId: user.id } });
                      const data = res?.data;
                      if (data?.status === 'APPROVED') {
                        setJoinStatus('APPROVED');
                        console.log('[Join] Approved for code', code, 'response:', data);
                        await loadStudentClasses();
                      } else if (data?.status === 'PENDING') {
                        setJoinStatus('PENDING');
                        console.log('[Join] Pending approval for code', code, 'response:', data);
                      } else {
                        setJoinStatus(null);
                        console.log('[Join] Unexpected response for code', code, 'response:', data);
                      }
                      setJoinCode("");
                    } catch (e) {
                      const msg = e?.response?.data?.message || e?.message || "Failed to request to join";
                      setJoinError(msg);
                      console.error('[Join] Error for code', code, ':', msg, e);
                    } finally {
                      setLoadingClasses(false);
                    }
                  }}>Join</Button>
                  <Button type="button" variant="secondary" onClick={loadStudentClasses}>Refresh</Button>
                </div>
              </form>
              <div className="hint">Example: ABC123</div>
              {loadingClasses ? (
                <p>Loading...</p>
              ) : (
                <ul style={{ marginTop: 12, listStyle: "none", padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {classes.map((c) => (
                    <li key={c.id}>
                      <Card
                        title={c.name}
                        subtitle={`${c.subject}${c.section ? ` • ${c.section}` : ''}`}
                        actions={
                          <div className="card-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button variant="secondary" onClick={async () => {
                              try {
                                setLoadingClasses(true);
                                await api.delete(`/classes/${c.id}/leave`, { params: { studentId: user.id } });
                                await loadStudentClasses();
                                // Reset selections for resources
                                setSelectedClass(null);
                                setResourceItems([]);
                              } catch (e) {
                                alert("Leave class requires backend endpoint.");
                              } finally {
                                setLoadingClasses(false);
                              }
                            }}>Leave</Button>
                            <Button variant="secondary" onClick={async () => { setActivePage('resources'); setSelectedClass(c); await loadResourcesForClass(c); }}>View Resources</Button>
                            <Button variant="secondary" onClick={() => setActivePage('submissions')}>View Assignments</Button>
                          </div>
                        }
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Chip color="info">Code: {c.classCode}</Chip>
                          {joinStatus === 'PENDING' && <Chip color="warning">Pending Approval</Chip>}
                          {joinStatus === 'APPROVED' && <Chip color="success">Enrolled</Chip>}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ marginTop: 8, color: "#666" }}>Joining the same class twice is prevented by backend rules.</p>
              {joinStatus === 'PENDING' && (
                <div style={{ marginTop: 8, color: '#8a6d3b' }}>
                  Join request sent. Waiting for teacher approval.
                </div>
              )}
              {joinStatus === 'APPROVED' && (
                <div style={{ marginTop: 8, color: '#3c763d' }}>
                  You are enrolled in this class.
                </div>
              )}
              {joinError && (
                <div style={{ marginTop: 8, color: '#a94442' }}>
                  {joinError}
                </div>
              )}
            </div>
          )}

          {/* 👉 REPLACE THIS */}
          {activePage === "submissions" && <Submissions user={user} />}

          {activePage === "notifications" && (
            <div>
              <h2>Notifications</h2>
              <div className="card" style={{ maxWidth: 640 }}>
                <div className="card-body">
                  <StudentNotifications userId={user?.id} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StudentNotifications({ userId }) {
  const [items, setItems] = useState([]);

  React.useEffect(() => {
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
