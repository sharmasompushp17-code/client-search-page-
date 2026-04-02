import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    clientCode: '',
    clientName: ''
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientCode || !formData.clientName) {
      toast.error('Please enter client code and client name');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.clientCode, formData.clientName);
      
      if (result.success) {
        toast.success('Admin panel opened successfully!');
        navigate('/admin/dashboard');
      } else {
        toast.error(result.message || 'Access denied');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Admin Login</h1>
          <p>Access your admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="clientCode">
              <FiLock />
              <span>Secret Client Code</span>
            </label>
            <input
              type="text"
              id="clientCode"
              name="clientCode"
              value={formData.clientCode}
              onChange={handleChange}
              placeholder="Enter secret client code"
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientName">
              <FiUser />
              <span>Client Name</span>
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Enter client name"
              className="form-input"
              autoComplete="off"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <FiLogIn />
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>

        <div className="login-footer">
          <p>Secure admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
