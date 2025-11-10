import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function TeacherDashboard({ userData, onLogout }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, Teacher!</h1>
            <p style={{ color: "var(--color-gray-600)" }}>Manage your classes and students</p>
          </div>
          <button className="btn btn-primary btn-sm">Create Class</button>
        </div>

        <div className="content-grid">
          <div className="stat-card">
            <h3>Active Classes</h3>
            <div className="value">3</div>
          </div>
          <div className="stat-card">
            <h3>Total Students</h3>
            <div className="value">45</div>
          </div>
          <div className="stat-card">
            <h3>Pending Submissions</h3>
            <div className="value">8</div>
          </div>
        </div>

        <div className="card mt-lg">
          <h2>Latest Submissions</h2>
          {/* TODO: Add submissions list */}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
