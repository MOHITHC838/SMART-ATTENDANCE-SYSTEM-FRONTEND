import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { FaUsers, FaChartBar, FaClipboardList, FaSignOutAlt, FaSync } from 'react-icons/fa';
import axios from 'axios';
import StudentList from './StudentList';
import AttendanceChart from './AttendanceChart';
import RequestsList from './RequestsList';
import '../../styles/components.css';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';

const FacultyDashboard = () => {
  const { currentUser, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  // Initialize with proper default structure
  const [attendanceData, setAttendanceData] = useState({
    totalStudents: 0,
    present: 0,
    absent: 0,
    byHour: {
      1: { present: 0, absent: 0 },
      2: { present: 0, absent: 0 },
      3: { present: 0, absent: 0 },
      4: { present: 0, absent: 0 },
      5: { present: 0, absent: 0 },
      6: { present: 0, absent: 0 }
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // Define loadAttendanceData using useCallback
  const loadAttendanceData = useCallback(async () => {
    if (!currentUser?.section) return;
    
    setLoading(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching attendance data for section:', currentUser.section, 'date:', today);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/attendance/class`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          date: today,
          section: currentUser.section
        }
      });

      console.log('API Response:', response.data);

      // Ensure the response has the expected structure
      const stats = response.data.stats || {
        totalStudents: 0,
        present: 0,
        absent: 0,
        byHour: {}
      };

      // Ensure byHour has all hours with default values
      const byHour = {};
      for (let i = 1; i <= 6; i++) {
        byHour[i] = stats.byHour[i] || { present: 0, absent: 0 };
      }

      setAttendanceData({
        totalStudents: stats.totalStudents || 0,
        present: stats.present || 0,
        absent: stats.absent || 0,
        byHour: byHour
      });
      
      setError('');
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      
      let errorMessage = 'Failed to load attendance data';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          // Optionally logout on 401
          // authLogout();
        } else {
          errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Set default data on error (already initialized, but ensure it's there)
      setAttendanceData({
        totalStudents: 0,
        present: 0,
        absent: 0,
        byHour: {
          1: { present: 0, absent: 0 },
          2: { present: 0, absent: 0 },
          3: { present: 0, absent: 0 },
          4: { present: 0, absent: 0 },
          5: { present: 0, absent: 0 },
          6: { present: 0, absent: 0 }
        }
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [currentUser?.section]);

  // Load data on mount and when section changes
  useEffect(() => {
    loadAttendanceData();
    
    // Refresh data every minute
    const interval = setInterval(loadAttendanceData, 60000);
    return () => clearInterval(interval);
  }, [loadAttendanceData]);

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadAttendanceData();
  };

  // Show loading state only on initial load
  if (initialLoad && loading) {
    return (
      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <div className="nav-brand">
            <h2>Faculty Dashboard</h2>
          </div>
        </nav>
        <div className="dashboard-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Faculty Dashboard</h2>
        </div>
        <div className="nav-links">
          <Link to="/faculty-dashboard" className="nav-link">
            <FaChartBar /> Overview
          </Link>
          <Link to="/faculty-dashboard/students" className="nav-link">
            <FaUsers /> Students
          </Link>
          <Link to="/faculty-dashboard/requests" className="nav-link">
            <FaClipboardList /> Requests
          </Link>
          <button onClick={handleLogout} className="nav-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="faculty-header">
          <div className="header-left">
            <h1>Welcome, {currentUser?.name || 'Faculty'}</h1>
            <p>{currentUser?.dept} Department - Class {currentUser?.section || 'N/A'}</p>
          </div>
          <button onClick={handleRefresh} className="btn-refresh" disabled={loading}>
            <FaSync className={loading ? 'spinning' : ''} /> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={handleRefresh} className="btn-retry-small">
              Retry
            </button>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <>
              <div className="stats-cards">
                <div className="stat-card">
                  <h3>Total Students</h3>
                  <p className="stat-value">{attendanceData.totalStudents}</p>
                </div>
                <div className="stat-card present">
                  <h3>Present Today</h3>
                  <p className="stat-value">{attendanceData.present}</p>
                </div>
                <div className="stat-card absent">
                  <h3>Absent Today</h3>
                  <p className="stat-value">{attendanceData.absent}</p>
                </div>
                <div className="stat-card">
                  <h3>Attendance %</h3>
                  <p className="stat-value">
                    {attendanceData.totalStudents > 0 
                      ? ((attendanceData.present / (attendanceData.totalStudents * 6)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
              <AttendanceChart data={attendanceData} loading={loading} />
            </>
          } />
          <Route path="/students" element={
            <StudentList 
              facultySection={currentUser?.section} 
              onRefresh={loadAttendanceData}
            />
          } />
          <Route path="/requests" element={
            <RequestsList 
              facultySection={currentUser?.section}
              onRefresh={loadAttendanceData}
            />
          } />
        </Routes>
      </div>
    </div>
  );
};

export default FacultyDashboard;