// ...existing code...
import React, { useState } from "react";
import api from "../api/axios";

export default function SetPassword({ onPasswordSet }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // get email from stored user (no email prop required)
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const email = user?.email;
      if (!email) {
        setError("No authenticated user found. Please sign in with Google first.");
        return;
      }

      // include token if available
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await api.post("/auth/set-password", { email, password }, { headers });
      console.log("Password updated:", res.data);

      if (res.data.token) localStorage.setItem("token", res.data.token);
      if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess("Password set successfully.");
      if (typeof onPasswordSet === "function") onPasswordSet(res.data);
    } catch (err) {
      console.error("SetPassword error:", err, err?.response?.data);
      setError(err.response?.data?.message || "Failed to set password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Password</h1>
          <p>Set a secure password for your new account.</p>
        </div>

        {error && <div className="error" style={{ color: "red" }}>{error}</div>}
        {success && <div className="success" style={{ color: "green" }}>{success}</div>}

        <form onSubmit={handleSetPassword}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            Save Password
          </button>
        </form>
      </div>
    </div>
  );
}
