"use client"

import { useState } from "react"
import "./login.css"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Logging in with:", username, password)
  }

  const handleGoogleSignIn = () => {
    console.log("Signing in with Google")
  }

  const handleRegister = () => {
    console.log("Navigating to register page")
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Welcome to SRMS</h2>
        <p className="login-subtitle">Please sign in with your institutional email to access student resources.</p>

        <button onClick={handleGoogleSignIn} className="google-signin-btn">
          Sign in with Google
        </button>

        <div className="registration-section">
          <h3 className="registration-title">New to SRMS?</h3>
          <p className="registration-subtitle">Click the button to Register</p>
          <button onClick={handleRegister} className="register-btn">
            Register
          </button>
        </div>
      </div>

      <footer className="login-footer">
        <span>© 2025 SRMS</span>
        <a href="#">Privacy Policy</a>
      </footer>
    </div>
  )
}

export default Login
