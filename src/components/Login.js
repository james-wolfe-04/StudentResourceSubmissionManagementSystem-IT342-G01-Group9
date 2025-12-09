import React, { useState } from "react";
import api from "../api/axios";
import GoogleLogin from "./GoogleLogin"; 
import "./styles/Login.css"; 

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [asTeacher, setAsTeacher] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Attempting login with:", { email, password });

      const response = await api.post("/auth/login", { email, password });
      
      console.log("Login response:", response);

      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      onLoginSuccess(user);
    } catch (err) {
      console.error("Login error full object:", err);
      console.error("Login error response data:", err.response?.data);
      console.error("Login error status:", err.response?.status);

      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to SRMS</h1>
          <p>Please sign in with your email or Google account to access student resources.</p>
        </div>


          <label style={{display: "flex", alignItems: "center", gap: 8}}>
                    <input
                        type="checkbox"
                        checked={asTeacher}
                        onChange={(e) => setAsTeacher(e.target.checked)}
                    />
                    <span> I am a teacher</span>
                </label>

          {/* Pass both props so GoogleLogin can send asTeacher and call onLoginSuccess */}
          <GoogleLogin asTeacher={asTeacher} onLoginSuccess={onLoginSuccess} />

        {error && (
          <div className="error" style={{ color: "red", marginBottom: "10px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          {/* ensure footer Google button also uses current asTeacher value */}
          <GoogleLogin asTeacher={asTeacher} onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
}