import React, { useState } from "react";
import api from "../api/axios";
import Button from "./ui/Button";
import Input from "./ui/Input";
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
      // Use axios instance baseURL (/api) and correct path
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      // Pass full payload so App can handle routing consistently
      onLoginSuccess({ user, token, mustSetPassword: false });
    } catch (err) {
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

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={asTeacher}
            onChange={(e) => setAsTeacher(e.target.checked)}
          />
          <span>I am a teacher</span>
        </label>

        <div style={{ margin: "16px 0" }}>
          <GoogleLogin
            asTeacher={asTeacher}
            onLoginSuccess={onLoginSuccess}
            onError={(msg) => setError(msg)}
          />
        </div>

        {error && <div className="error" style={{ color: "red", marginBottom: 10 }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" style={{ width: "100%" }}>Sign In</Button>
        </form>
      </div>
    </div>
  );
}