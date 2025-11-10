"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../../components/sidebar"
import { teacherService } from "../../services/api"
import "../../styles/dashboard.css"

function CreateClass() {
  const [formData, setFormData] = useState({
    className: "",
    subject: "",
    section: "",
    description: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // For frontend development, just show success and navigate
    console.log("Class would be created:", formData)
    alert("Class created successfully!")
    navigate("/teacher/dashboard")
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role="teacher" />
      <div className="dashboard-main">
        <div className="card">
          <h2>Create New Class</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Class Name</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                placeholder="Enter class name"
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter subject"
              />
            </div>

            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="Enter section"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter class description"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Create Class
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateClass
