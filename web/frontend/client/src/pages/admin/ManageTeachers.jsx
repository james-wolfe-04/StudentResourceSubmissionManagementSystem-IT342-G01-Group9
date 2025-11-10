import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function ManageTeachers() {
  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Teachers Management</h1>
            <p style={{ color: "var(--color-gray-600)" }}>Manage all teacher accounts</p>
          </div>
          <button className="btn btn-primary btn-sm">Add Teacher</button>
        </div>

        <div className="card">
          <h2>List of Teachers</h2>
          {/* TODO: Add teachers list */}
        </div>
      </div>
    </div>
  )
}

export default ManageTeachers
