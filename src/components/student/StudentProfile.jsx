import React, { useEffect, useState } from 'react';
import { FaUserGraduate, FaEnvelope, FaPhone, FaBook, FaIdCard } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components.css';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';
const StudentProfile = ({ user, attendanceData }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/attendance/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.stats) {
          setStats({
            present: response.data.stats.present,
            absent: response.data.stats.absent,
            total: response.data.stats.total,
            percentage: response.data.stats.percentage
          });
        }
      } catch (error) {
        console.error('Failed to fetch attendance stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceStats();
  }, [user?.id, token]);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUserGraduate size={50} />
        </div>
        <h2>{user?.name}</h2>
        <p className="profile-role">Student - Section {user?.section}</p>
      </div>

      <div className="profile-details">
        <div className="detail-card">
          <FaIdCard className="detail-icon" />
          <div className="detail-info">
            <label>Register Number</label>
            <p>{user?.registerNo}</p>
          </div>
        </div>

        <div className="detail-card">
          <FaBook className="detail-icon" />
          <div className="detail-info">
            <label>Department</label>
            <p>{user?.dept}</p>
          </div>
        </div>

        <div className="detail-card">
          <FaEnvelope className="detail-icon" />
          <div className="detail-info">
            <label>Email</label>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="detail-card">
          <FaPhone className="detail-icon" />
          <div className="detail-info">
            <label>Phone</label>
            <p>{user?.phone}</p>
          </div>
        </div>
      </div>

      <div className="attendance-summary">
        <h3>Today's Attendance</h3>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="summary-stats">
            <div className="stat-box">
              <span className="stat-label">Present</span>
              <span className="stat-value present">{stats.present}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Absent</span>
              <span className="stat-value absent">{stats.absent}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Remaining</span>
              <span className="stat-value remaining">
                {6 - stats.present}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;