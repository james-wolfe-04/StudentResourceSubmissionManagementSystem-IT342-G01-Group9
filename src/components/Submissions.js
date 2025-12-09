import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./styles/Submissions.css";

export default function Submissions({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // 1️⃣ Load classes of the student
        const classRes = await api.get(`/classes/student/${user.id}`);

        // 2️⃣ Load assignments for each class
        let allAssignments = [];
        for (const cls of classRes.data) {
          const a = await api.get(`/assignments/class/${cls.id}`);
          allAssignments.push(...a.data.map(x => ({ ...x, className: cls.name })));
        }

        setAssignments(allAssignments);

        // 3️⃣ Load submissions for logged-in student
        let subMap = {};
        for (const a of allAssignments) {
          try {
            const s = await api.get(`/assignments/${a.id}/submissions`);
            if (s.data != null) {
              subMap[a.id] = s.data;
            }
          } catch (err) {
            console.log("No submission found for assignment " + a.id);
          }
        }

        setSubmissions(subMap);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 🔽 Submit assignment
  const handleSubmit = async (assignmentId) => {
    if (!content && !file) {
      alert("Add text or file first.");
      return;
    }

    const formData = new FormData();
    if (content) formData.append("content", content);
    if (file) formData.append("file", file);

    try {
      const res = await api.post(
        `/assignments/${assignmentId}/submit-file`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Submitted!");

      // Update UI WITHOUT RELOAD
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: res.data
      }));

      setContent("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Submit failed.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="submissions-container">
      <h2>My Assignments</h2>

      {assignments.map(a => {
        const sub = submissions[a.id];

        return (
          <div key={a.id} className="assignment-card">
            <h3>{a.title}</h3>
            <p><strong>Class:</strong> {a.className}</p>
            <p><strong>Description:</strong> {a.description || "No description"}</p>

            {/* ========================== */}
            {/* IF ALREADY SUBMITTED       */}
            {/* ========================== */}
            {sub ? (
              <div className="submitted-box">
                <p><strong>Status:</strong> Submitted ✅</p>
                <p>
                  <strong>Submitted At:</strong>{" "}
                  {new Date(sub.submittedAt).toLocaleString()}
                </p>

                {sub.content && (
                  <p><strong>Your Answer:</strong> {sub.content}</p>
                )}

                {sub.fileUrl && (
                  <p>
                    <strong>File:</strong>{" "}
                    <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </p>
                )}

                <p><strong>Grade:</strong> {sub.grade}</p>

                {/* comment not implemented yet in backend */}
                <p><strong>Teacher Comment:</strong> {sub.comment || "No comment yet"}</p>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Write your answer..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />

                <input type="file" onChange={e => setFile(e.target.files[0])} />

                <button onClick={() => handleSubmit(a.id)}>Submit</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
