import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiMail, FiPhone, FiX, FiCheck } from 'react-icons/fi';

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    notes: ''
  });

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('https://client-search-page-1.onrender.com/api/clients', {
        params: { search: searchTerm }
      });
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchClients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      notes: ''
    });
    setEditingClient(null);
  };

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company || '',
        address: client.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        notes: client.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingClient) {
        const response = await axios.put(`https://client-search-page-1.onrender.com/api/clients/${editingClient._id}`, formData);
        if (response.data.success) {
          toast.success('Client updated successfully');
          fetchClients();
          closeModal();
        }
      } else {
        const response = await axios.post('https://client-search-page-1.onrender.com/api/clients', formData);
        if (response.data.success) {
          toast.success('Client created successfully');
          fetchClients();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This will also delete all associated projects and payments.')) {
      return;
    }

    try {
      const response = await axios.delete(`https://client-search-page-1.onrender.com/api/clients/${clientId}`);
      if (response.data.success) {
        toast.success('Client deleted successfully');
        fetchClients();
      }
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="admin-clients-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Clients</h1>
            <p>Manage your clients and their information</p>
          </div>
          <button onClick={() => openModal()} className="add-btn">
            <FiPlus />
            <span>Add Client</span>
          </button>
        </div>

        <div className="search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="clients-grid">
          {clients.length === 0 ? (
            <div className="no-data">
              <FiUser />
              <p>No clients found</p>
              <button onClick={() => openModal()} className="add-btn">
                <FiPlus />
                <span>Add your first client</span>
              </button>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client._id} className="client-card">
                <div className="client-header">
                  <div className="client-avatar">
                    <FiUser />
                  </div>
                  <div className="client-info">
                    <h3>{client.name}</h3>
                    <p className="client-code">{client.clientCode}</p>
                  </div>
                  <span className={`status-badge ${client.status}`}>
                    {client.status}
                  </span>
                </div>

                <div className="client-details">
                  <div className="detail-item">
                    <FiMail />
                    <span>{client.email}</span>
                  </div>
                  <div className="detail-item">
                    <FiPhone />
                    <span>{client.phone}</span>
                  </div>
                  {client.company && (
                    <div className="detail-item">
                      <FiUser />
                      <span>{client.company}</span>
                    </div>
                  )}
                </div>

                <div className="client-stats">
                  <div className="stat">
                    <span className="label">Total</span>
                    <span className="value">₹{client.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Paid</span>
                    <span className="value paid">₹{client.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Pending</span>
                    <span className="value pending">₹{client.pendingAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="client-actions">
                  <button onClick={() => openModal(client)} className="edit-btn">
                    <FiEdit2 />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(client._id)} className="delete-btn">
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={closeModal} className="close-btn">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Client name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address.street">Street Address</label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.city">City</label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.state">State</label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.country">Country</label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <FiCheck />
                  <span>{editingClient ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClients;
