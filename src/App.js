import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./components/Login";
import SetPassword from "./components/SetPassword";
import StudentDashboard from "./components/Dashboard";        // Student
import TeacherDashboard from "./components/TeacherDashboard"; // Teacher
import AdminDashboard from "./components/AdminDashboard";     // Admin


// All API calls should use src/api/axios.js; remove conflicting global axios overrides

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

// Helper: determine correct dashboard path based on user role
const getDashboardPath = (user) => {
  if (!user || !user.role) return "/";

  const role = user.role.toUpperCase();

  if (role === "ADMIN") return "/admin-dashboard";
  if (role === "TEACHER") return "/teacher-dashboard";
  return "/dashboard"; // Default: Student
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [needsPassword, setNeedsPassword] = useState(false);
  const navigate = useNavigate();

  // Sync localStorage state on mount (basic validation)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && user) {
      setUser(null);
    }
  }, []);

  const handleLoginSuccess = (authPayload) => {
    // Expecting { user, token, mustSetPassword? }
    const { user: nextUser, token, mustSetPassword } = authPayload || {};
    if (!nextUser || !token) return;

    localStorage.setItem("user", JSON.stringify(nextUser));
    localStorage.setItem("token", token);

    setUser(nextUser);
    setNeedsPassword(!!mustSetPassword);

    if (!mustSetPassword) {
      navigate(getDashboardPath(nextUser));
    }
  };

  const handlePasswordSet = (data) => {
    const updatedUser = data.user;

    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("token", data.token);

    setUser(updatedUser);
    setNeedsPassword(false);

    navigate(getDashboardPath(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setNeedsPassword(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }

    if (needsPassword) {
      return <Navigate to="/" replace />;
    }

    const userRole = user.role?.toUpperCase();
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to={getDashboardPath(user)} replace />;
    }

    return children;
  };

  return (
    <Routes>
      {/* Root route: Login → SetPassword → Dashboard redirect */}
      <Route
        path="/"
        element={
          !user ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : needsPassword ? (
            <SetPassword email={user.email} onPasswordSet={handlePasswordSet} />
          ) : (
            <Navigate to={getDashboardPath(user)} replace />
          )
        }
      />

      {/* Role-based dashboards */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? getDashboardPath(user) : "/"} replace />}
      />
    </Routes>
  );
}

export default AppWrapper;
