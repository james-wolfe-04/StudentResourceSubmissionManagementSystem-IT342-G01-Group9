"use client"

import { useState } from "react"

function Sidebar({ role, onLogout }) {
  const [isOpen, setIsOpen] = useState(true)

  const getMenuItems = () => {
    switch (role) {
      case "student":
        return [
          { label: "Dashboard", path: "/student/dashboard" },
          { label: "My Classes", path: "/student/classes" },
          { label: "Assignments", path: "/student/assignments" },
          { label: "Grades", path: "/student/grades" },
          { label: "Submissions", path: "/student/submissions" },
        ]
      case "teacher":
        return [
          { label: "Dashboard", path: "/teacher/dashboard" },
          { label: "My Classes", path: "/teacher/classes" },
          { label: "Create Class", path: "/teacher/create-class" },
          { label: "Assignments", path: "/teacher/assignments" },
          { label: "Submissions", path: "/teacher/submissions" },
        ]
      case "admin":
        return [
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "Manage Teachers", path: "/admin/manage-teachers" },
          { label: "Manage Students", path: "/admin/manage-students" },
          { label: "System Settings", path: "/admin/settings" },
          { label: "Reports", path: "/admin/reports" },
        ]
      default:
        return []
    }
  }

  return (
    <div className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
      <div style={{ marginBottom: "var(--spacing-2xl)" }}>
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>SRMS</h2>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-gray-600)" }}>
          {role.charAt(0).toUpperCase() + role.slice(1)} Portal
        </p>
      </div>

      <nav className="nav-menu">
        {getMenuItems().map((item) => (
          <a key={item.path} href={item.path} className="nav-item">
            {item.label}
          </a>
        ))}
      </nav>

      <div
        style={{
          marginTop: "var(--spacing-2xl)",
          paddingTop: "var(--spacing-lg)",
          borderTop: "1px solid var(--color-gray-200)",
        }}
      >
        <button onClick={onLogout} className="btn btn-secondary" style={{ width: "100%" }}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
