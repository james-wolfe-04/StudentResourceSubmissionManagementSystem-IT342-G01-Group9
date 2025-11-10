import React, { useState, useEffect } from 'react';
import { studentService } from '../services/api';

const SubmissionList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await studentService.getSubmissions();
        setSubmissions(response.data);
      } catch (err) {
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <div className="spinner">Loading submissions...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="submission-list">
      <h2>My Submissions</h2>
      <div className="submission-list-container">
        {submissions.length === 0 ? (
          <p>No submissions found</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Class</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.assignmentName}</td>
                    <td>{submission.className}</td>
                    <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${submission.status === 'graded' ? 'success' : 'warning'}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.grade || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionList;