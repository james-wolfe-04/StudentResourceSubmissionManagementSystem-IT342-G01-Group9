"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../../services/api"
import "../../styles/auth.css"

function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    // Temporary mock login for frontend development
    if (email === "student@example.com" && password === "password") {
      onLogin("student", { name: "Test Student", email })
      navigate("/student/dashboard")
    } else if (email === "teacher@example.com" && password === "password") {
      onLogin("teacher", { name: "Test Teacher", email })
      navigate("/teacher/dashboard")
    } else if (email === "admin@example.com" && password === "password") {
      onLogin("admin", { name: "Test Admin", email })
      navigate("/admin/dashboard")
    } else {
      setError("Invalid credentials. Try student@example.com / password")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to SRMS</h1>
          <p>Please sign in with your institutional email to access student resources.</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          New to SRMS?
          <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  )
}

export default Login
