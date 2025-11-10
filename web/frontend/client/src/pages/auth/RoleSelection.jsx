"use client"
import "../../styles/auth.css"

function RoleSelection({ onSelectRole }) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to SRMS</h1>
          <p>Please sign in with your institutional email to access student resources.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          <button
            className="btn btn-primary"
            onClick={() => onSelectRole("student", { role: "student" })}
            style={{ width: "100%" }}
          >
            STUDENT
          </button>

          <button
            className="btn btn-primary"
            onClick={() => onSelectRole("teacher", { role: "teacher" })}
            style={{ width: "100%" }}
          >
            TEACHER
          </button>

          <button
            className="btn btn-primary"
            onClick={() => onSelectRole("admin", { role: "admin" })}
            style={{ width: "100%" }}
          >
            ADMIN
          </button>
        </div>

        <div className="auth-footer">
          New to SRMS?
          <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
