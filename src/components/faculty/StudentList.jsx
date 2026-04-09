import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaCheckCircle, FaTimesCircle, FaEye, FaDownload, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import '../../styles/components.css';

const API_URL = 'http://localhost:5000/api';

const StudentList = ({ facultySection }) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHour, setSelectedHour] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    present: 0,
    absent: 0,
    byHour: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClassAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/attendance/class`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          date: selectedDate,
          hour: selectedHour !== 'all' ? selectedHour : undefined,
          section: facultySection
        }
      });

      setStudents(response.data.students);
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to load attendance data. Please try again.');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate, selectedHour, facultySection]);

  useEffect(() => {
    loadClassAttendance();
  }, [loadClassAttendance]);

  const filteredStudents = students.filter(student =>
    student.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student.registerNo?.includes(searchTerm)
  );

  const getPresentCount = (student) => {
    if (selectedHour === 'all') {
      return student.presentCount || 0;
    }
    return student.presentHours?.includes(parseInt(selectedHour)) ? 1 : 0;
  };

  const getAbsentCount = (student) => {
    if (selectedHour === 'all') {
      return student.absentCount || 0;
    }
    return student.absentHours?.includes(parseInt(selectedHour)) ? 1 : 0;
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(
        filteredStudents.map(s => ({
          'Register No': s.student.registerNo,
          'Name': s.student.name,
          'Department': s.student.dept,
          'Section': s.student.section,
          'Present Hours': s.presentCount,
          'Absent Hours': s.absentCount,
          'Status': s.presentCount > s.absentCount ? 'Good' : 'Low Attendance',
          'Attendance %': ((s.presentCount / 6) * 100).toFixed(1) + '%'
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      
      // Add summary sheet
      const summaryData = [
        ['Date', selectedDate],
        ['Section', facultySection],
        ['Hour', selectedHour === 'all' ? 'All Hours' : `Hour ${selectedHour}`],
        ['Total Students', stats.totalStudents],
        ['Present', stats.present],
        ['Absent', stats.absent],
        ['Attendance %', ((stats.present / (stats.totalStudents * 6)) * 100).toFixed(1) + '%']
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      XLSX.writeFile(wb, `attendance_${facultySection}_${selectedDate}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="student-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-list-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadClassAttendance} className="btn-retry">
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list-container">
      <div className="list-header">
        <div className="header-title">
          <h2>Class {facultySection} - Student Attendance</h2>
          <p className="student-count">Total Students: {stats.totalStudents}</p>
        </div>
        <div className="header-actions">
          <button onClick={exportToExcel} className="btn-export">
            <FaDownload /> Export to Excel
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="date-filter">
          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or register number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          className="hour-filter"
          value={selectedHour}
          onChange={(e) => setSelectedHour(e.target.value)}
        >
          <option value="all">All Hours</option>
          {[1, 2, 3, 4, 5, 6].map(hour => (
            <option key={hour} value={hour}>Hour {hour}</option>
          ))}
        </select>

        <button onClick={loadClassAttendance} className="btn-refresh">
          <FaSync /> Refresh
        </button>
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <span className="stat-label">Filtered Students</span>
          <span className="stat-value">{filteredStudents.length}</span>
        </div>
        <div className="stat-card present">
          <span className="stat-label">Present</span>
          <span className="stat-value">{stats.present}</span>
        </div>
        <div className="stat-card absent">
          <span className="stat-label">Absent</span>
          <span className="stat-value">{stats.absent}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Attendance %</span>
          <span className="stat-value">
            {stats.totalStudents > 0 
              ? ((stats.present / (stats.totalStudents * 6)) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="no-results">
          <p>No students found in Class {facultySection}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Register No.</th>
                <th>Name</th>
                <th>Department</th>
                <th>Section</th>
                <th>Present Hours</th>
                <th>Absent Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.student.registerNo}>
                  <td className="register-no">{student.student.registerNo}</td>
                  <td className="student-name">{student.student.name}</td>
                  <td>{student.student.dept}</td>
                  <td>Class {student.student.section}</td>
                  <td>
                    <span className="present-count">
                      <FaCheckCircle /> {getPresentCount(student)}
                    </span>
                  </td>
                  <td>
                    <span className="absent-count">
                      <FaTimesCircle /> {getAbsentCount(student)}
                    </span>
                  </td>
                  <td>
                    {getPresentCount(student) > getAbsentCount(student) ? (
                      <span className="status-badge good">Good</span>
                    ) : (
                      <span className="status-badge warning">Low Attendance</span>
                    )}
                  </td>
                  <td>
                    <button className="action-btn view-btn" title="View Details">
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;