import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./styles/Submissions.css";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

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
        // Prefer consolidated endpoint to reduce requests
        const res = await api.get(`/assignments/student/${user.id}`);
        const allAssignments = (res.data || []).map(x => ({
          ...x,
          className: x?.className || 'Class'
        }));
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
      console.warn('[Submit] Missing content or file');
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
      console.log('[Submit] Submitted assignment', assignmentId, res.data);
      alert("Submitted!");

      // Update UI WITHOUT RELOAD
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: res.data
      }));

      setContent("");
      setFile(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Submit failed';
      console.error('[Submit] Error:', msg, err);
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
          <Card key={a.id} title={a.title} subtitle={`Class: ${a.className}`}>
            <p><strong>Description:</strong> {a.description || "No description"}</p>

            {/* Assignment attachment for download */}
            {a.attachmentUrl && (
              <p>
                <strong>Attachment:</strong> <a href={a.attachmentUrl} target="_blank" rel="noreferrer">{a.attachmentFileName || 'Download'}</a>
              </p>
            )}

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
                <p><strong>Feedback:</strong> {sub.feedback || "No feedback yet"}</p>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Write your answer..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />

                <Input type="file" onChange={e => setFile(e.target.files[0])} label="Attach file (optional)" />

                <Button onClick={() => handleSubmit(a.id)} variant="primary">Submit</Button>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
