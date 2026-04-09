import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FaUserGraduate, FaChalkboardTeacher, FaCamera } from 'react-icons/fa';
import '../../styles/components.css';

const Register = () => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    facultyId: '',
    dept: '',
    section: 'B',
    assignedSection: 'B',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });
  const [faceImage, setFaceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { registerStudent, registerFaculty } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setFaceImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!formData.dept) {
      setError('Please select a department');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (userType === 'student') {
      if (!formData.registerNumber.trim()) {
        setError('Register number is required');
        return false;
      }

      if (!formData.section) {
        setError('Please select a section');
        return false;
      }

      if (!faceImage) {
        setError('Face image is required for student registration');
        return false;
      }
    }

    if (userType === 'faculty') {
      if (!formData.facultyId.trim()) {
        setError('Faculty ID is required');
        return false;
      }

      if (!formData.assignedSection) {
        setError('Please select an assigned class');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (userType === 'student') {
        const studentFormData = new FormData();
        studentFormData.append('name', formData.name.trim());
        studentFormData.append('email', formData.email.trim().toLowerCase());
        studentFormData.append('password', formData.password);
        studentFormData.append('phone', formData.phone.trim());
        studentFormData.append('dept', formData.dept);
        studentFormData.append('registerNo', formData.registerNumber.trim());
        studentFormData.append('section', formData.section);
        studentFormData.append('faceImage', faceImage);

        console.log('Submitting student registration with data:', {
          name: formData.name,
          email: formData.email,
          registerNo: formData.registerNumber,
          section: formData.section,
          dept: formData.dept,
          phone: formData.phone
        });

        const result = await registerStudent(studentFormData);
        
        if (result.success) {
          setSuccess('Registration successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/student-dashboard');
          }, 2000);
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        const facultyData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim(),
          dept: formData.dept,
          facultyId: formData.facultyId.trim(),
          section: formData.assignedSection
        };

        console.log('Submitting faculty registration with data:', facultyData);

        const result = await registerFaculty(facultyData);
        
        if (result.success) {
          setSuccess('Registration successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/faculty-dashboard');
          }, 2000);
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register for Smart Attendance System</p>
        
        <div className="user-type-selector">
          <button
            type="button"
            className={`type-btn ${userType === 'student' ? 'active' : ''}`}
            onClick={() => setUserType('student')}
            disabled={loading}
          >
            <FaUserGraduate /> Student
          </button>
          <button
            type="button"
            className={`type-btn ${userType === 'faculty' ? 'active' : ''}`}
            onClick={() => setUserType('faculty')}
            disabled={loading}
          >
            <FaChalkboardTeacher /> Faculty
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                disabled={loading}
              />
            </div>

            <div className="form-group half">
              <label>{userType === 'student' ? 'Register Number' : 'Faculty ID'}</label>
              <input
                type="text"
                name={userType === 'student' ? 'registerNumber' : 'facultyId'}
                className="form-control"
                value={userType === 'student' ? formData.registerNumber : formData.facultyId}
                onChange={handleChange}
                required
                placeholder={userType === 'student' ? 'Enter register number' : 'Enter faculty ID'}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Department</label>
              <select
                name="dept"
                className="form-control"
                value={formData.dept}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>

            {userType === 'student' ? (
              <div className="form-group half">
                <label>Section</label>
                <select
                  name="section"
                  className="form-control"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            ) : (
              <div className="form-group half">
                <label>Assigned Class</label>
                <select
                  name="assignedSection"
                  className="form-control"
                  value={formData.assignedSection}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email"
                disabled={loading}
              />
            </div>

            <div className="form-group half">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter 10-digit phone number"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
                disabled={loading}
              />
            </div>

            <div className="form-group half">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                disabled={loading}
              />
            </div>
          </div>

          {userType === 'student' && (
            <div className="form-group">
              <label>Face Image <span className="required">*</span></label>
              <div className="face-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                  required
                  disabled={loading}
                  id="face-image"
                />
                <label htmlFor="face-image" className="file-label">
                  <FaCamera /> Choose Face Image
                </label>
                {imagePreview && (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Face preview" className="image-preview-small" />
                  </div>
                )}
                <small className="file-hint">Upload a clear front-facing photo (max 5MB)</small>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;