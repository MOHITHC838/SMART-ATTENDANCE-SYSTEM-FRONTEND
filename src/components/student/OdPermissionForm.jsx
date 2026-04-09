import React, { useState, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaCalendar, FaClock, FaFileAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components.css';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';
const OdPermissionForm = ({ user }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    hour: '',
    category: 'od',
    reason: '',
    supportingDoc: null
  });
  const [submittedForms, setSubmittedForms] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'od', label: 'On Duty (OD)', icon: '🎯' },
    { value: 'permission', label: 'Permission', icon: '📝' },
    { value: 'leave', label: 'Leave', icon: '🏖️' },
    { value: 'sick', label: 'Sick Leave', icon: '🤒' }
  ];

  const hours = [1, 2, 3, 4, 5, 6];

  // Load student's requests from MongoDB
  const loadRequests = useCallback(async () => {
    if (!user?.registerNo) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/requests/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const requests = response.data || [];
      // Sort by date (newest first)
      const sortedRequests = requests.sort((a, b) => 
        new Date(b.appliedDate) - new Date(a.appliedDate)
      );
      setSubmittedForms(sortedRequests);
      setError('');
    } catch (err) {
      console.error('Error loading requests:', err);
      let errorMessage = 'Failed to load your applications';
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.registerNo, token]);

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should be less than 5MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF and image files are allowed');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        supportingDoc: file
      }));
    }
  };

  const validateForm = () => {
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    if (!formData.hour) {
      setError('Please select an hour');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Please provide a reason');
      return false;
    }
    if (formData.reason.length < 10) {
      setError('Reason must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const requestData = new FormData();
      requestData.append('type', formData.category);
      requestData.append('date', formData.date);
      requestData.append('hour', formData.hour);
      requestData.append('reason', formData.reason.trim());
      
      if (formData.supportingDoc) {
        requestData.append('document', formData.supportingDoc);
      }

      // Submit to MongoDB
      const response = await axios.post(`${API_URL}/requests/submit`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Request submitted:', response.data);
      
      // Reload requests
      await loadRequests();
      
      setSuccess('Application submitted successfully!');
      
      // Reset form
      setFormData({
        date: '',
        hour: '',
        category: 'od',
        reason: '',
        supportingDoc: null
      });

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error submitting request:', err);
      
      let errorMessage = 'Failed to submit application';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (value) => {
    const category = categories.find(c => c.value === value);
    return category ? category.label : value;
  };

  const getCategoryIcon = (value) => {
    const category = categories.find(c => c.value === value);
    return category ? category.icon : '📋';
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-badge approved';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>OD / Permission / Leave Application</h2>
        <p>Submit your requests for approval</p>
      </div>

      {error && (
        <div className="error-message">
          <FaTimesCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FaCheckCircle /> {success}
        </div>
      )}

      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label>
                <FaCalendar /> Date <span className="required">*</span>
              </label>
              <input
                type="date"
                name="date"
                className="form-control"
                value={formData.date}
                onChange={handleChange}
                min={minDate}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group half">
              <label>
                <FaClock /> Hour <span className="required">*</span>
              </label>
              <select
                name="hour"
                className="form-control"
                value={formData.hour}
                onChange={handleChange}
                required
                disabled={submitting}
              >
                <option value="">Select Hour</option>
                {hours.map(hour => (
                  <option key={hour} value={hour}>Hour {hour}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <div className="category-buttons">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, category: cat.value})}
                  disabled={submitting}
                >
                  <span className="category-icon">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <FaFileAlt /> Reason <span className="required">*</span>
            </label>
            <textarea
              name="reason"
              className="form-control"
              rows="4"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Please provide detailed reason for your request..."
              required
              minLength="10"
              maxLength="500"
              disabled={submitting}
            ></textarea>
            <small className="char-count">
              {formData.reason.length}/500 characters
            </small>
          </div>

          <div className="form-group">
            <label>Supporting Document (if any)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                className="form-control-file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={submitting}
                id="document-upload"
              />
              <label htmlFor="document-upload" className="file-label">
                Choose File
              </label>
              {formData.supportingDoc && (
                <span className="file-name">
                  {formData.supportingDoc.name}
                </span>
              )}
            </div>
            <small className="file-hint">
              Max size: 5MB. Allowed: PDF, DOC, DOCX, JPG, PNG
            </small>
          </div>

          <button 
            type="submit" 
            className="btn-primary submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <>
                <FaPaperPlane /> Submit Application
              </>
            )}
          </button>
        </form>
      </div>

      <div className="submitted-forms-section">
        <h3>Your Applications</h3>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your applications...</p>
          </div>
        ) : submittedForms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h4>No applications yet</h4>
            <p>Submit your first application using the form above</p>
          </div>
        ) : (
          <div className="forms-list">
            {submittedForms.map(form => (
              <div key={form._id} className="form-card">
                <div className="form-card-header">
                  <div className="header-left">
                    <span className="category-icon-small">
                      {getCategoryIcon(form.type)}
                    </span>
                    <span className={getStatusBadgeClass(form.status)}>
                      {form.status ? form.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                  <span className="form-date">
                    {formatDate(form.date)}
                  </span>
                </div>
                
                <div className="form-card-body">
                  <div className="form-detail-row">
                    <strong>Category:</strong>
                    <span className="category-label">
                      {getCategoryLabel(form.type)}
                    </span>
                  </div>
                  
                  <div className="form-detail-row">
                    <strong>Hour:</strong>
                    <span className="hour-badge">Hour {form.hour}</span>
                  </div>
                  
                  <div className="form-detail-row">
                    <strong>Reason:</strong>
                    <p className="reason-text">{form.reason}</p>
                  </div>
                  
                  <div className="form-detail-row">
                    <strong>Submitted:</strong>
                    <span className="submitted-date">
                      {formatDateTime(form.appliedDate)}
                    </span>
                  </div>

                  {form.facultyRemark && (
                    <div className="form-detail-row remark">
                      <strong>Faculty Remark:</strong>
                      <p className="remark-text">{form.facultyRemark}</p>
                    </div>
                  )}
                </div>

                {form.status === 'approved' && (
                  <div className="form-card-footer approved">
                    <FaCheckCircle /> Approved
                    {form.processedDate && (
                      <span className="footer-date">
                        on {formatDate(form.processedDate)}
                      </span>
                    )}
                  </div>
                )}
                
                {form.status === 'rejected' && (
                  <div className="form-card-footer rejected">
                    <FaTimesCircle /> Rejected
                    {form.processedDate && (
                      <span className="footer-date">
                        on {formatDate(form.processedDate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OdPermissionForm;