import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function ManageClass() {
  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Manage Class</h1>
        </div>

        <div className="card">
          <h2>Class Details</h2>
          {/* TODO: Add class management UI */}
        </div>

        <div className="card mt-lg">
          <h2>Upload Resources</h2>
          {/* TODO: Add resource upload */}
        </div>

        <div className="card mt-lg">
          <h2>Enrolled Students</h2>
          {/* TODO: Add student list */}
        </div>
      </div>
    </div>
  )
}

export default ManageClass
