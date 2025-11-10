"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import Sidebar from "../../components/sidebar"
import { studentService } from "../../services/api"
import "../../styles/dashboard.css"

function SubmitAssignment() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { assignmentId } = useParams()

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file to submit")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData()
    formData.append('file', file)

    try {
      await studentService.submitAssignment(assignmentId, formData)
      setSuccess("Assignment submitted successfully!")
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assignment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="dashboard-main">
        <div className="card">
          <h2>Submit Your Assignment</h2>
          <p>Upload your completed assignment file below</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group mt-lg">
            <label>Select File</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              accept=".pdf,.doc,.docx,.txt"
              disabled={loading}
            />
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !file}
          >
            {loading ? "Submitting..." : "Submit Assignment"}</button>
        </div>

        <div className="card mt-lg">
          <h2>Previous Submissions</h2>
          {/* TODO: Add submissions history */}
        </div>
      </div>
    </div>
  )
}

export default SubmitAssignment
