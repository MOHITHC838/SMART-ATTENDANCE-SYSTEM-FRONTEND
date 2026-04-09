import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { FaCamera, FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components.css';

const API_URL = 'https://smart-attendance-system-backend-r2o0.onrender.com/api';
const AttendanceCamera = ({ activeHour, onMarkAttendance, canMark, attendanceMarked }) => {
  const webcamRef = useRef(null);
  const { currentUser, token } = useAuth(); // Get token from useAuth, not from props
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMatched, setFaceMatched] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [cameraError, setCameraError] = useState(false);

  // Load face-api models
  useEffect(() => {
  const loadModels = async () => {
    try {
      setLoadingModels(true);
      
      // Use CDN instead of local files
      const modelPath = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
      
      setModelsLoaded(true);
      setError('');
      console.log('✅ Models loaded from CDN');
      
    } catch (err) {
      console.error('❌ Failed to load models from CDN:', err);
      setError('Failed to load face detection models');
    } finally {
      setLoadingModels(false);
    }
  };

  loadModels();
}, []);

  // Detect face in webcam stream
  const detectFace = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return;

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.3
      });

      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        return detection;
      } else {
        setFaceDetected(false);
        return null;
      }
    } catch (err) {
      console.error('Face detection error:', err);
      return null;
    }
  }, [modelsLoaded]);

  // Continuous face detection
  useEffect(() => {
    let interval;
    if (isCameraActive && modelsLoaded && !attendanceMarked) {
      interval = setInterval(detectFace, 300);
    }
    return () => clearInterval(interval);
  }, [isCameraActive, modelsLoaded, attendanceMarked, detectFace]);

  const startCamera = () => {
    setIsCameraActive(true);
    setAttendanceStatus(null);
    setFaceDetected(false);
    setFaceMatched(false);
    setError('');
    setCameraError(false);
  };

  const captureAndMarkAttendance = async () => {
    if (!webcamRef.current) {
      setError('Camera not available');
      return;
    }

    if (!faceDetected) {
      setError('No face detected. Please ensure your face is clearly visible.');
      return;
    }

    // Check if token exists
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }
      
      // Convert base64 to blob
      const blob = await fetch(imageSrc).then(res => res.blob());
      
      // Create form data
      const formData = new FormData();
      formData.append('faceImage', blob, 'attendance.jpg');
      formData.append('hour', activeHour.toString());
      formData.append('date', new Date().toISOString());

      console.log('Sending attendance request for hour:', activeHour);
      console.log('Using token:', token ? 'Token exists' : 'No token');

      // Send to backend with token in headers
      const response = await axios.post(`${API_URL}/attendance/mark`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        setFaceMatched(true);
        setConfidence(response.data.faceMatch?.confidence || 1);
        setAttendanceStatus('present');
        onMarkAttendance(activeHour);
        
        console.log('✅ Attendance marked successfully:', response.data);
      }
    } catch (err) {
      console.error('❌ Attendance marking error:', err);
      
      let errorMsg = 'Failed to mark attendance';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        
        if (err.response.status === 401) {
          errorMsg = 'Authentication failed. Please login again.';
          // You might want to trigger logout here
        } else {
          errorMsg = err.response.data?.error || `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      
      if (errorMsg.includes('Face verification failed')) {
        setAttendanceStatus('unauthorized');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAttendance = () => {
    setIsCameraActive(false);
    setAttendanceStatus(null);
    setFaceDetected(false);
    setFaceMatched(false);
    setError('');
  };

  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError(true);
    setError('Camera access denied. Please allow camera access and try again.');
  };

  // Loading state
  if (loadingModels) {
    return (
      <div className="camera-container">
        <div className="camera-prompt">
          <FaSpinner className="spinner" size={50} />
          <h3>Loading Face Detection Models...</h3>
          <p>Please wait while we initialize the camera system.</p>
        </div>
      </div>
    );
  }

  if (!canMark) {
    return (
      <div className="camera-container">
        <div className="camera-prompt">
          <FaTimesCircle size={50} color="#f44336" />
          <h3>Attendance Not Available</h3>
          <p>Hour {activeHour} is not currently active for attendance marking.</p>
        </div>
      </div>
    );
  }

  if (attendanceMarked) {
    return (
      <div className="camera-container success">
        <FaCheckCircle className="success-icon" />
        <h3>Attendance Marked Successfully!</h3>
        <p>Your attendance for Hour {activeHour} has been recorded as Present.</p>
        {confidence > 0 && (
          <p className="confidence-text">Face Match Confidence: {(confidence * 100).toFixed(1)}%</p>
        )}
        <div className="attendance-badge present">Present ✓</div>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <h2>Mark Attendance - Hour {activeHour}</h2>
      
      {!isCameraActive ? (
        <div className="camera-prompt">
          <FaCamera size={50} />
          <p>Click the button below to start camera and mark attendance</p>
          <button onClick={startCamera} className="btn-primary">
            Start Camera
          </button>
        </div>
      ) : (
        <div className="camera-active">
          <div className="webcam-wrapper">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam"
              mirrored={true}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
              onUserMediaError={handleCameraError}
            />
            {faceDetected && (
              <div className="face-detected-overlay">
                <div className="face-detected-badge">✓ Face Detected</div>
              </div>
            )}
            {!faceDetected && isCameraActive && !cameraError && (
              <div className="face-not-detected-overlay">
                <div className="face-not-detected-badge">Position your face in frame</div>
              </div>
            )}
          </div>

          <div className="camera-controls">
            <div className="status-indicator">
              <p>Camera Status: {cameraError ? '❌ Error' : '✅ Active'}</p>
              <p>Face Detection: {faceDetected ? '✓ Detected' : '⏳ Waiting...'}</p>
              {faceMatched && <p className="success-text">✓ Face Verified</p>}
            </div>

            {error && <div className="error-message">{error}</div>}
            {cameraError && (
              <div className="error-message">
                Cannot access camera. Please ensure:
                <ul>
                  <li>Camera is connected</li>
                  <li>Browser has camera permission</li>
                  <li>No other app is using the camera</li>
                </ul>
              </div>
            )}

            <div className="button-group">
              <button 
                onClick={captureAndMarkAttendance} 
                className="btn-primary"
                disabled={!faceDetected || isProcessing || cameraError}
              >
                {isProcessing ? <FaSpinner className="spinner" /> : 'Mark Attendance'}
              </button>
              <button onClick={cancelAttendance} className="btn-secondary" disabled={isProcessing}>
                Cancel
              </button>
            </div>
          </div>

          {attendanceStatus === 'unauthorized' && (
            <div className="attendance-result unauthorized">
              <FaTimesCircle /> Unauthorized Person - Face Not Recognized
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceCamera;