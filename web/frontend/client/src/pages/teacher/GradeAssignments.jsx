import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import Sidebar from "../../components/sidebar"
import { teacherService } from "../../services/api"
import "../../styles/dashboard.css"

function GradeAssignments() {
  const { classId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [grading, setGrading] = useState({})

  useEffect(() => {
    fetchSubmissions()
  }, [classId])

  const fetchSubmissions = async () => {
    try {
      const response = await teacherService.getSubmissions()
      setSubmissions(response.data)
    } catch (err) {
      setError("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (submissionId, grade) => {
    setGrading(prev => ({
      ...prev,
      [submissionId]: grade
    }))
  }

  const handleGradeSubmit = async (submissionId) => {
    if (!grading[submissionId]) return

    try {
      await teacherService.gradeAssignment(submissionId, {
        grade: grading[submissionId]
      })
      
      // Update the submission in the list
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId
          ? { ...sub, grade: grading[submissionId], status: 'graded' }
          : sub
      ))

      // Clear the grading input
      setGrading(prev => {
        const newGrading = { ...prev }
        delete newGrading[submissionId]
        return newGrading
      })
    } catch (err) {
      setError("Failed to submit grade")
    }
  }

  if (loading) return <div className="spinner">Loading submissions...</div>

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Grade Assignments</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="card">
          <h2>Pending Submissions</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Submitted Date</th>
                  <th>File</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.studentName}</td>
                    <td>{submission.assignmentName}</td>
                    <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <a 
                        href={submission.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </a>
                    </td>
                    <td>
                      {submission.status === 'graded' ? (
                        submission.grade
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grading[submission.id] || ''}
                          onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                          className="form-control"
                          style={{ width: "80px" }}
                        />
                      )}
                    </td>
                    <td>
                      {submission.status !== 'graded' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleGradeSubmit(submission.id)}
                          disabled={!grading[submission.id]}
                        >
                          Submit Grade
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeAssignments
