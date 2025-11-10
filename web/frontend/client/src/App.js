"use client"

import { useState, useEffect, createContext } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import "./styles/App.css"

// Auth Pages
import Login from "./pages/auth/login"
import Register from "./pages/auth/Register"
import RoleSelection from "./pages/auth/RoleSelection"

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard"
import ClassOverview from "./pages/student/ClassOverview"
import SubmitAssignment from "./pages/student/SubmitAssignment"
import StudentGrades from "./pages/student/StudentGrades"

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard"
import CreateClass from "./pages/teacher/CreateClass"
import ManageClass from "./pages/teacher/ManageClass"
import GradeAssignments from "./pages/teacher/GradeAssignments"

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard"
import ManageTeachers from "./pages/admin/ManageTeachers"

// Create Auth Context
export const AuthContext = createContext()

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated, userRole, requiredRole }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("auth")
    if (savedAuth) {
      const { isAuthenticated: auth, userRole: role, userData: data } = JSON.parse(savedAuth)
      setIsAuthenticated(auth)
      setUserRole(role)
      setUserData(data)
    }
    setLoading(false)
  }, [])

  // Save auth to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          isAuthenticated,
          userRole,
          userData,
        }),
      )
    }
  }, [isAuthenticated, userRole, userData, loading])

  const handleLogin = (role, data) => {
    setIsAuthenticated(true)
    setUserRole(role)
    setUserData(data)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setUserData(null)
    localStorage.removeItem("auth")
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userData }}>
      <Router>
        <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/role-selection" element={<RoleSelection onSelectRole={handleLogin} />} />

          {/* ========== STUDENT ROUTES ========== */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="student">
                <StudentDashboard userData={userData} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/class/:classId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="student">
                <ClassOverview onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/submit-assignment/:assignmentId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="student">
                <SubmitAssignment onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/grades"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="student">
                <StudentGrades onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ========== TEACHER ROUTES ========== */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="teacher">
                <TeacherDashboard userData={userData} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-class"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="teacher">
                <CreateClass onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/manage-class/:classId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="teacher">
                <ManageClass onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grade/:classId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="teacher">
                <GradeAssignments onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ========== ADMIN ROUTES ========== */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="admin">
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-teachers"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole} requiredRole="admin">
                <ManageTeachers onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ========== DEFAULT & ERROR ROUTES ========== */}
          <Route path="/" element={<Navigate to={isAuthenticated ? `/${userRole}/dashboard` : "/login"} replace />} />
          <Route path="/unauthorized" element={<div className="text-center p-lg mt-lg">Unauthorized Access</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
