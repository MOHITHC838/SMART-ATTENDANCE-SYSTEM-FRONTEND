import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { FaUser, FaCamera, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';
import StudentProfile from './StudentProfile';
import AttendanceCamera from './AttendanceCamera';
import OdPermissionForm from './OdPermissionForm';
import { getStudentAttendance, markAttendanceInExcel } from '../../utils/excelUtils';
import '../../styles/components.css';

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeHour, setActiveHour] = useState(1);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 6, byHour: {} });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load attendance data
  const loadAttendanceData = useCallback(() => {
    if (currentUser?.registerNo) {
      try {
        setLoading(true);
        const data = getStudentAttendance(currentUser.registerNo);
        setAttendanceData(data);
        setError('');
      } catch (err) {
        setError('Failed to load attendance data');
        console.error('Error loading attendance:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser?.registerNo]);

  // Update hour based on current time
  const updateHour = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    setCurrentTime(now);
    
    // College hours: 9 AM to 3 PM (6 hours)
    if (hours >= 9 && hours < 15) {
      const currentHour = hours - 8; // 9 AM = Hour 1, 10 AM = Hour 2, etc.
      setActiveHour(currentHour);
    } else {
      setActiveHour(0); // No active hour
    }
  }, []);

  // Initial load and setup
  useEffect(() => {
    if (currentUser) {
      loadAttendanceData();
    }
    
    updateHour();
    const timeInterval = setInterval(updateHour, 60000); // Check every minute
    const attendanceInterval = setInterval(loadAttendanceData, 30000); // Refresh attendance every 30 seconds

    return () => {
      clearInterval(timeInterval);
      clearInterval(attendanceInterval);
    };
  }, [currentUser, loadAttendanceData, updateHour]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAttendance = (hour) => {
    if (!currentUser?.registerNo || !currentUser?.name) {
      setError('User information not available');
      return;
    }

    try {
      markAttendanceInExcel(currentUser.registerNo, currentUser.name, hour);
      // Update attendance data after marking
      loadAttendanceData();
    } catch (err) {
      setError('Failed to mark attendance. Please try again.');
      console.error('Error marking attendance:', err);
    }
  };

  const canMarkAttendance = (hour) => {
    return hour === activeHour && 
           hour >= 1 && hour <= 6 && 
           attendanceData.byHour && 
           !attendanceData.byHour[`hour${hour}`];
  };

  const getAttendanceStatus = (hour) => {
    return attendanceData.byHour?.[`hour${hour}`] || false;
  };

  if (!currentUser) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <p>Please login to access the dashboard</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Smart Attendance</h2>
        </div>
        <div className="nav-links">
          <Link to="/student-dashboard" className="nav-link">
            <FaUser /> Profile
          </Link>
          <Link to="/student-dashboard/attendance" className="nav-link">
            <FaCamera /> Attendance
          </Link>
          <Link to="/student-dashboard/forms" className="nav-link">
            <FaClipboardList /> OD/Permission
          </Link>
          <button onClick={handleLogout} className="nav-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        <div className="hour-indicator">
          <div className="time-info">
            <h3>
              Current Time: {currentTime.toLocaleTimeString()}
              {activeHour > 0 ? (
                <span className="active-hour-badge">Hour {activeHour} Active</span>
              ) : (
                <span className="inactive-hour-badge">No Active Hour</span>
              )}
            </h3>
          </div>
          
          <div className="hour-buttons">
            {[1, 2, 3, 4, 5, 6].map((hour) => (
              <button
                key={hour}
                className={`hour-btn ${activeHour === hour ? 'active' : ''} 
                  ${getAttendanceStatus(hour) ? 'marked' : ''}
                  ${!canMarkAttendance(hour) && !getAttendanceStatus(hour) ? 'disabled' : ''}`}
                disabled={!canMarkAttendance(hour)}
                onClick={() => navigate('/student-dashboard/attendance')}
                title={getAttendanceStatus(hour) ? 'Attendance already marked' : `Mark attendance for Hour ${hour}`}
              >
                <span className="hour-number">Hour {hour}</span>
                {getAttendanceStatus(hour) && (
                  <span className="check-mark">
                    <FaCheckCircle />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="attendance-summary-mini">
            <div className="summary-item">
              <span className="label">Present:</span>
              <span className="value present">{attendanceData.present || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Absent:</span>
              <span className="value absent">{attendanceData.absent || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Remaining:</span>
              <span className="value remaining">
                {6 - (attendanceData.present || 0)}
              </span>
            </div>
          </div>
        </div>

        <Routes>
          <Route path="/" element={
            <StudentProfile 
              user={currentUser} 
              attendanceData={attendanceData}
            />
          } />
          <Route path="/attendance" element={
            <AttendanceCamera 
              activeHour={activeHour}
              onMarkAttendance={handleMarkAttendance}
              canMark={canMarkAttendance(activeHour)}
              attendanceMarked={getAttendanceStatus(activeHour)}
              userName={currentUser?.name}
              registerNo={currentUser?.registerNo}
            />
          } />
          <Route path="/forms" element={
            <OdPermissionForm 
              user={currentUser}
            />
          } />
        </Routes>
      </div>
    </div>
  );
};

// Add missing import for FaCheckCircle
import { FaCheckCircle } from 'react-icons/fa';

export default StudentDashboard;