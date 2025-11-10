import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function ClassOverview() {
  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Mathematics 101</h1>
        </div>

        <div className="card">
          <h2>Enrolled Students</h2>
          {/* TODO: Add student list */}
        </div>

        <div className="card mt-lg">
          <h2>Resources</h2>
          {/* TODO: Add resources list */}
        </div>

        <div className="card mt-lg">
          <h2>Assignments</h2>
          {/* TODO: Add assignments list */}
        </div>
      </div>
    </div>
  )
}

export default ClassOverview
