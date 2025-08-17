import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const validateUserId = (userId) => {
    const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return userIdRegex.test(userId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    if (!validateUserId(userId)) {
      setError('Please enter a valid User ID (GUID format)');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/checkAuthorization', {
        userId: userId.trim()
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

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    if (error) setError('');
    if (result) setResult(null);
  };

  return (
    <div className="container">
      <h1 className="title">Group Membership Checker (User ID)</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId" className="label">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            className="input"
            value={userId}
            onChange={handleUserIdChange}
            placeholder="Enter User ID (GUID format) to check"
            disabled={loading}
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        <button
          type="submit"
          className="button"
          disabled={loading || !userId.trim()}
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
              <p><strong>User ID:</strong> {result.userDetails.id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App; 