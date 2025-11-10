"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../../services/api"
import "../../styles/auth.css"

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Client-side validations
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }

    // Mock successful registration
    console.log("Registration data:", formData)
    alert("Registration successful! Please login with your credentials.")
    navigate("/login")
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Register</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
            />
          </div>

          <div className="form-group">
            <label>Role Selection</label>
            <div className="role-selection">
              <div
                className={`role-option ${formData.role === "student" ? "selected" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, role: "student" }))}
              >
                Student
              </div>
              <div
                className={`role-option ${formData.role === "teacher" ? "selected" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, role: "teacher" }))}
              >
                Teacher
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Register
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  )
}

export default Register
