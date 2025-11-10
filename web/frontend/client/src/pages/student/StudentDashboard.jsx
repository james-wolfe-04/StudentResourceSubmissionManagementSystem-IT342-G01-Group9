import Sidebar from "../../components/sidebar"
import "../../styles/dashboard.css"
import ClassList from "../../components/ClassList"
import SubmissionList from "../../components/SubmissionList"

function StudentDashboard({ userData, onLogout }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role="student" onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, Student!</h1>
            <p style={{ color: "var(--color-gray-600)" }}>Here's your academic overview</p>
          </div>
          <button className="btn btn-primary btn-sm">Create Note</button>
        </div>

        <div className="content-grid">
          <div className="stat-card">
            <h3>Enrolled Classes</h3>
            <div className="value">3</div>
          </div>
          <div className="stat-card">
            <h3>Pending Assignments</h3>
            <div className="value">2</div>
          </div>
          <div className="stat-card">
            <h3>Average Grade</h3>
            <div className="value">88%</div>
          </div>
        </div>

        <div className="card mt-lg">
          <h2>Joined Classes</h2>
          <ClassList classes={userData.classes} />
        </div>

        <div className="card mt-lg">
          <h2>Recent Submissions</h2>
          <SubmissionList submissions={userData.submissions} />
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
