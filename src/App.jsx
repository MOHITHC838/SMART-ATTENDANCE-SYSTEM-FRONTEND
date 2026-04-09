import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StudentDashboard from './components/student/StudentDashboard';
import FacultyDashboard from './components/faculty/FacultyDashboard';
// Remove this line if you don't have initializeAppData exported
// import { initializeAppData } from './utils/excelUtils';
import './styles/App.css';

function App() {
  // Remove this useEffect if you don't have initializeAppData
  // useEffect(() => {
  //   initializeAppData();
  // }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student-dashboard/*" element={<StudentDashboard />} />
            <Route path="/faculty-dashboard/*" element={<FacultyDashboard />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;