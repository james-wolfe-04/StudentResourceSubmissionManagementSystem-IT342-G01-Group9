import React, { useState, useEffect } from "react"; 
import axios from "axios"; 
import "./styles/StudentDashboard.css";
import classesIcon from "./assets/classes-icon.png";
import submissionsIcon from "./assets/submissions-icon.png";
import notificationsIcon from "./assets/notifications-icon.png";
import logo from "./assets/logo.png";
import Submissions from "./Submissions";

export default function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null); // manage user here
  const [activePage, setActivePage] = useState("welcome");

  // Auto-load user & token from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      // Optionally, set default axios header
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    onLogout?.();
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <img src={logo} alt="Logo" className="logo" />
          <h2>Student Dashboard</h2>
        </div>
        <div className="nav-right">
          <button className="nav-button" onClick={() => setActivePage("profile")}>
            Profile
          </button>
          <button className="nav-button" onClick={() => setActivePage("resources")}>
            Resources
          </button>
          <button className="nav-button" onClick={onLogout}>
            Logout
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
            onClick={() => setActivePage("classes")}
          >
            <img src={classesIcon} alt="My Classes" /> My Classes
          </button>

          <button
            className={`sidebar-button ${activePage === "submissions" ? "active" : ""}`}
            onClick={() => setActivePage("submissions")}
          >
            <img src={submissionsIcon} alt="Submissions" /> Submissions
          </button>

          <button
            className={`sidebar-button ${activePage === "notifications" ? "active" : ""}`}
            onClick={() => setActivePage("notifications")}
          >
            <img src={notificationsIcon} alt="Notifications" /> Notifications
          </button>
        </aside>

        <main className="main-content">
          {activePage === "welcome" && <h1>Welcome, {user?.fullName}!</h1>}
          {activePage === "profile" && <h1>Profile Page</h1>}
          {activePage === "resources" && <h1>Resources Page</h1>}
          {activePage === "classes" && <h1>My Classes Page</h1>}

          {/* 👉 REPLACE THIS */}
          {activePage === "submissions" && <Submissions user={user} />}

          {activePage === "notifications" && <h1>Notifications Page</h1>}
        </main>
      </div>
    </div>
  );
}
