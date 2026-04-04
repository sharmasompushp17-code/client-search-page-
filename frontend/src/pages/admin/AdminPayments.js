import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiDollarSign, FiUser, FiFolder, FiCalendar, FiCreditCard, FiX, FiCheck, FiDownload } from 'react-icons/fi';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    notes: ''
  });

  const fetchPayments = useCallback(async () => {
    try {
      const response = await axios.get('https://client-search-page-1.onrender.com/api/payments', {
        params: { status: statusFilter }
      });
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('https://client-search-page-1.onrender.com/api/clients');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients');
    }
  }, []);

  const fetchProjects = async (clientId) => {
    if (!clientId) {
      setProjects([]);
      return;
    }

    try {
      const response = await axios.get('https://client-search-page-1.onrender.com/api/projects', { params: { clientId } });
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchClients();
  }, [fetchPayments, fetchClients]);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  useEffect(() => {
    if (formData.clientId) {
      fetchProjects(formData.clientId);
    }
  }, [formData.clientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'clientId') {
      setFormData(prev => ({
        ...prev,
        clientId: value,
        projectId: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      projectId: '',
      amount: '',
      paymentMethod: 'cash',
      description: '',
      notes: ''
    });
    setProjects([]);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId || !formData.projectId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post('https://client-search-page-1.onrender.com/api/payments/manual', formData);
      if (response.data.success) {
        toast.success('Payment recorded successfully');
        fetchPayments();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const downloadInvoice = (payment) => {
    // Create a simple invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table th { background-color: #000; color: #fff; }
          .total { text-align: right; font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Client Management System</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
          <p><strong>Client:</strong> ${payment.clientId?.name || 'N/A'}</p>
          <p><strong>Project:</strong> ${payment.projectId?.projectName || 'N/A'}</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${payment.description || 'Payment for project'}</td>
              <td>₹${payment.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          <p>Total: ₹${payment.amount.toLocaleString()}</p>
        </div>
        
        <p style="margin-top: 40px; text-align: center; color: #666;">
          Thank you for your payment!
        </p>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${payment.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="admin-payments-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Payments</h1>
            <p>Manage all payment records</p>
          </div>
          <button onClick={openModal} className="add-btn">
            <FiPlus />
            <span>Record Payment</span>
          </button>
        </div>

        <div className="filters-bar">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Client</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    <FiDollarSign />
                    <p>No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>{payment.invoiceNumber}</td>
                    <td>
                      <div className="client-info">
                        <span className="name">{payment.clientId?.name || 'Unknown'}</span>
                        <span className="code">{payment.clientId?.clientCode || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{payment.projectId?.projectName || 'Unknown'}</td>
                    <td className="amount">₹{payment.amount.toLocaleString()}</td>
                    <td>
                      <span className={`method-badge ${payment.paymentMethod}`}>
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => downloadInvoice(payment)}
                        className="download-btn"
                        title="Download Invoice"
                      >
                        <FiDownload />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Manual Payment</h2>
              <button onClick={closeModal} className="close-btn">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="clientId">Client *</label>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="projectId">Project *</label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  required
                  disabled={!formData.clientId}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} (Pending: ₹{project.pendingAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Amount (₹) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Payment description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <FiCheck />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
