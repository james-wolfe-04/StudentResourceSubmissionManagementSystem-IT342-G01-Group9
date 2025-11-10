import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Update this with your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

// Student Services
export const studentService = {
  getDashboard: () => api.get('/student/dashboard'),
  getClasses: () => api.get('/student/classes'),
  getClass: (classId) => api.get(`/student/classes/${classId}`),
  submitAssignment: (assignmentId, formData) => 
    api.post(`/student/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getGrades: () => api.get('/student/grades'),
  getSubmissions: () => api.get('/student/submissions'),
};

// Teacher Services
export const teacherService = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getClasses: () => api.get('/teacher/classes'),
  createClass: (classData) => api.post('/teacher/classes', classData),
  manageClass: (classId, updates) => api.put(`/teacher/classes/${classId}`, updates),
  getAssignments: () => api.get('/teacher/assignments'),
  gradeAssignment: (submissionId, grade) => 
    api.post(`/teacher/submissions/${submissionId}/grade`, grade),
  getSubmissions: () => api.get('/teacher/submissions'),
};

// Admin Services
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getTeachers: () => api.get('/admin/teachers'),
  addTeacher: (teacherData) => api.post('/admin/teachers', teacherData),
  updateTeacher: (teacherId, updates) => api.put(`/admin/teachers/${teacherId}`, updates),
  deleteTeacher: (teacherId) => api.delete(`/admin/teachers/${teacherId}`),
  getSystemStats: () => api.get('/admin/stats'),
};

export default api;