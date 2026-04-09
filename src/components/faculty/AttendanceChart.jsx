import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import '../../styles/components.css';

const AttendanceChart = ({ data, loading }) => {
  // Default data structure if data is incomplete
  const safeData = {
    totalStudents: data?.totalStudents || 0,
    present: data?.present || 0,
    absent: data?.absent || 0,
    byHour: data?.byHour || {}
  };

  // Prepare hour data with safe defaults
  const hourData = [
    { 
      name: 'Hour 1', 
      present: safeData.byHour[1]?.present || 0, 
      absent: safeData.byHour[1]?.absent || 0 
    },
    { 
      name: 'Hour 2', 
      present: safeData.byHour[2]?.present || 0, 
      absent: safeData.byHour[2]?.absent || 0 
    },
    { 
      name: 'Hour 3', 
      present: safeData.byHour[3]?.present || 0, 
      absent: safeData.byHour[3]?.absent || 0 
    },
    { 
      name: 'Hour 4', 
      present: safeData.byHour[4]?.present || 0, 
      absent: safeData.byHour[4]?.absent || 0 
    },
    { 
      name: 'Hour 5', 
      present: safeData.byHour[5]?.present || 0, 
      absent: safeData.byHour[5]?.absent || 0 
    },
    { 
      name: 'Hour 6', 
      present: safeData.byHour[6]?.present || 0, 
      absent: safeData.byHour[6]?.absent || 0 
    },
  ];

  const pieData = [
    { name: 'Present', value: safeData.present },
    { name: 'Absent', value: safeData.absent },
  ];

  const COLORS = ['#4CAF50', '#f44336'];

  // Show loading state
  if (loading) {
    return (
      <div className="chart-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Show message if no data
  if (safeData.totalStudents === 0) {
    return (
      <div className="chart-container">
        <h2 className="chart-title">Attendance Analytics</h2>
        <div className="no-data-container">
          <p className="no-data-message">No attendance data available for today.</p>
          <p className="no-data-submessage">Students haven't marked attendance yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h2 className="chart-title">Attendance Analytics</h2>
      
      <div className="charts-wrapper">
        <div className="chart-box">
          <h3>Hourly Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#4CAF50" name="Present" />
              <Bar dataKey="absent" fill="#f44336" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Overall Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="stat-box present">
          <div className="stat-label">Present</div>
          <div className="stat-value">{safeData.present}</div>
          <div className="stat-percentage">
            {safeData.totalStudents > 0 
              ? ((safeData.present / (safeData.totalStudents * 6)) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="stat-box absent">
          <div className="stat-label">Absent</div>
          <div className="stat-value">{safeData.absent}</div>
          <div className="stat-percentage">
            {safeData.totalStudents > 0 
              ? ((safeData.absent / (safeData.totalStudents * 6)) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;