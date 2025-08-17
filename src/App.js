import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/checkAuthorization', {
        email: email.trim()
      });

      setResult(response.data);
    } catch (err) {
      console.error('Error checking authorization:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 500) {
        setError('Server error. Please check your configuration and try again.');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (result) setResult(null);
  };

  return (
    <div className="container">
      <h1 className="title">Group Membership Checker (Email)</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="input"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter email address to check"
            disabled={loading}
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        <button
          type="submit"
          className="button"
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Checking Authorization...
            </div>
          ) : (
            'Check Permission'
          )}
        </button>
      </form>

      {result && (
        <div className={`result ${result.success ? (result.isAuthorized ? 'success' : 'error') : 'error'}`}>
          <h3>{result.isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}</h3>
          <p>{result.message}</p>
          
          {result.userDetails && (
            <div className="user-details">
              <h4>User Details:</h4>
              <p><strong>Email:</strong> {result.userDetails.email}</p>
              <p><strong>User ID:</strong> {result.userDetails.id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App; 