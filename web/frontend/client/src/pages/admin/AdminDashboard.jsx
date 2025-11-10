import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function AdminDashboard({ onLogout }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
        </div>

        <div className="content-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="value">150</div>
          </div>
          <div className="stat-card">
            <h3>Teachers</h3>
            <div className="value">25</div>
          </div>
          <div className="stat-card">
            <h3>Students</h3>
            <div className="value">125</div>
          </div>
        </div>

        <div className="card mt-lg">
          <h2>System Statistics</h2>
          {/* TODO: Add system stats */}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
