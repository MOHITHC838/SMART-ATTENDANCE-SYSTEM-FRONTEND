import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaFilter, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components.css';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';

const RequestsList = ({ facultySection, onRefresh }) => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Load requests from MongoDB
  const loadRequests = useCallback(async () => {
    if (!facultySection) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/requests/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const requestsData = response.data || [];
      setRequests(requestsData);
      
      // Calculate stats
      const pending = requestsData.filter(r => r.status === 'pending').length;
      const approved = requestsData.filter(r => r.status === 'approved').length;
      const rejected = requestsData.filter(r => r.status === 'rejected').length;
      
      setStats({
        pending,
        approved,
        rejected,
        total: requestsData.length
      });
      
    } catch (err) {
      console.error('Error loading requests:', err);
      let errorMessage = 'Failed to load requests';
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [facultySection, token]);

  // Process request (approve/reject)
  const handleStatusUpdate = async (requestId, newStatus) => {
    setProcessing(prev => ({ ...prev, [requestId]: true }));
    setError('');
    
    try {
      const remark = newStatus === 'approved' 
        ? 'Approved by faculty' 
        : 'Rejected by faculty';
      
      await axios.put(`${API_URL}/requests/process/${requestId}`, 
        { status: newStatus, remark },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Refresh the list
      await loadRequests();
      
      // Call parent refresh if provided
      if (onRefresh) onRefresh();
      
    } catch (err) {
      console.error('Error updating request:', err);
      let errorMessage = `Failed to ${newStatus} request`;
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Load requests on mount and when filter changes
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Filter requests based on selected filter
  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getCategoryLabel = (category) => {
    const categories = {
      'od': 'On Duty (OD)',
      'permission': 'Permission',
      'leave': 'Leave',
      'sick': 'Sick Leave'
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'od': '#667eea',
      'permission': '#f59e0b',
      'leave': '#ef4444',
      'sick': '#8b5cf6'
    };
    return colors[category] || '#64748b';
  };

  const getStatusClass = (status) => {
    return status ? status.toLowerCase() : 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="requests-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <div className="header-title">
          <h2>Student Requests</h2>
          <p className="requests-subtitle">Manage OD, Permission, and Leave applications</p>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={loadRequests}
          disabled={loading}
        >
          <FaSync className={loading ? 'spinning' : ''} /> 
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card pending">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h4>Pending</h4>
            <p className="stat-number">{stats.pending}</p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h4>Approved</h4>
            <p className="stat-number">{stats.approved}</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon">
            <FaTimesCircle />
          </div>
          <div className="stat-content">
            <h4>Rejected</h4>
            <p className="stat-number">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filters-section">
        <div className="filter-label">
          <FaFilter /> Filter by:
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All <span className="count">({stats.total})</span>
          </button>
          <button 
            className={`filter-btn pending ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending <span className="count">({stats.pending})</span>
          </button>
          <button 
            className={`filter-btn approved ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved <span className="count">({stats.approved})</span>
          </button>
          <button 
            className={`filter-btn rejected ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected <span className="count">({stats.rejected})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="requests-list">
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No {filter !== 'all' ? filter : ''} requests found</h3>
            <p>There are no {filter !== 'all' ? filter : ''} requests to display at the moment.</p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <div key={request._id || request.id} className="request-card">
              <div className="request-header">
                <div className="header-left">
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {request.status ? request.status.toUpperCase() : 'PENDING'}
                  </span>
                  <span className="request-date">
                    📅 {formatDate(request.date)}
                  </span>
                  <span className="request-time">
                    <FaClock /> Hour {request.hour}
                  </span>
                </div>
                <span className="submitted-date">
                  Submitted: {formatDate(request.appliedDate || request.submittedDate)}
                </span>
              </div>
              
              <div className="request-body">
                <div className="student-info">
                  <h3>{request.student?.user?.name || request.name}</h3>
                  <p className="register-no">
                    Register No: {request.student?.registerNo || request.registerNo}
                  </p>
                </div>
                
                <div className="request-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <strong>Category:</strong> 
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(request.type || request.category) }}
                      >
                        {getCategoryLabel(request.type || request.category)}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <strong>Class:</strong> 
                      <span className="section-badge">
                        Class {request.student?.section || request.section || facultySection}
                      </span>
                    </div>
                  </div>
                  
                  <div className="detail-item full-width">
                    <strong>Reason:</strong>
                    <p className="reason-text">{request.reason}</p>
                  </div>
                  
                  {request.facultyRemark && (
                    <div className="detail-item full-width remark">
                      <strong>Faculty Remark:</strong>
                      <p className="remark-text">{request.facultyRemark}</p>
                    </div>
                  )}
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleStatusUpdate(request._id || request.id, 'approved')}
                    disabled={processing[request._id || request.id]}
                  >
                    {processing[request._id || request.id] ? (
                      'Processing...'
                    ) : (
                      <>
                        <FaCheckCircle /> Approve
                      </>
                    )}
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleStatusUpdate(request._id || request.id, 'rejected')}
                    disabled={processing[request._id || request.id]}
                  >
                    {processing[request._id || request.id] ? (
                      'Processing...'
                    ) : (
                      <>
                        <FaTimesCircle /> Reject
                      </>
                    )}
                  </button>
                </div>
              )}

              {request.status !== 'pending' && (
                <div className="request-status-info">
                  <div className={`status-message ${getStatusClass(request.status)}`}>
                    <span className="status-icon">
                      {request.status === 'approved' ? <FaCheckCircle /> : <FaTimesCircle />}
                    </span>
                    <span className="status-text">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                      {formatDate(request.processedDate || new Date())} at{' '}
                      {formatTime(request.processedDate || new Date())}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestsList;