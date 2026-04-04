import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiUser, FiCode } from 'react-icons/fi';

const ClientSearch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientCode: '',
    clientName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientCode && !formData.clientName) {
      toast.error('Please enter client code or name');
      return;
    }

    setLoading(true);

    try {
      const params = {};
      if (formData.clientCode) params.clientCode = formData.clientCode;
      if (formData.clientName) params.clientName = formData.clientName;

      const response = await axios.get('https://client-search-page-1.onrender.com/api/clients/search', { params });

      if (response.data.success) {
        toast.success('Client found!');
        navigate('/client/dashboard', { state: { clientData: response.data } });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Client not found. Please check your details.');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-search-page">
      <div className="search-container">
        <div className="search-header">
          <h1>Client Portal</h1>
          <p>Access your projects and payment information</p>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="form-group">
            <label htmlFor="clientCode">
              <FiCode />
              <span>Client Code</span>
            </label>
            <input
              type="text"
              id="clientCode"
              name="clientCode"
              value={formData.clientCode}
              onChange={handleChange}
              placeholder="Enter your client code"
              className="form-input"
            />
          </div>

          <div className="form-divider">
            <span>OR</span>
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
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          <button type="submit" className="search-btn" disabled={loading}>
            <FiSearch />
            <span>{loading ? 'Searching...' : 'Access Dashboard'}</span>
          </button>
        </form>

        <div className="search-footer">
          <p>Don't have your client code? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientSearch;
