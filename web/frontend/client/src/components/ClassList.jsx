import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await studentService.getClasses();
        setClasses(response.data);
      } catch (err) {
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) return <div className="spinner">Loading classes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="class-list">
      <h2>My Classes</h2>
      <div className="class-list-container">
        {classes.length === 0 ? (
          <p>No classes found</p>
        ) : (
          <div className="grid grid-cols-2 gap-md">
            {classes.map((classItem) => (
              <div 
                key={classItem.id}
                className="card clickable"
                onClick={() => navigate(`/student/class/${classItem.id}`)}
              >
                <h3>{classItem.className}</h3>
                <p className="text-gray-600">{classItem.subject}</p>
                <p className="text-sm">Section: {classItem.section}</p>
                <div className="mt-md">
                  <span className="badge badge-primary">{classItem.students?.length || 0} students</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassList;