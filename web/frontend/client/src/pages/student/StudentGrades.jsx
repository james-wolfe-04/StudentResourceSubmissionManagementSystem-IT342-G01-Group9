import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"

function StudentGrades() {
  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Grades</h1>
        </div>

        <div className="card">
          <h2>Grade Summary</h2>
          {/* TODO: Add grades table */}
        </div>
      </div>
    </div>
  )
}

export default StudentGrades
