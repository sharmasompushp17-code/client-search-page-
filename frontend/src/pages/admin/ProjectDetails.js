import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiX, FiDollarSign, FiCalendar, FiUser, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import './ProjectDetails.css';

const ProjectDetails = ({ projectId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await axios.get(`https://client-search-page-1.onrender.com/api/projects/${projectId}/details`);
      if (response.data.success) {
        setProject(response.data.project);
        setPayments(response.data.payments);
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      toast.error('Failed to fetch project details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails, projectId]);

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      pending: '#f59e0b',
      failed: '#ef4444',
      refunded: '#6366f1'
    };
    return colors[status] || '#6b7280';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Completed', icon: <FiCheckCircle /> },
      pending: { label: 'Pending', icon: <FiClock /> },
      failed: { label: 'Failed', icon: <FiAlertCircle /> },
      refunded: { label: 'Refunded', icon: <FiX /> }
    };
    return badges[status] || { label: status, icon: null };
  };

  if (loading) {
    return (
      <div className="project-details-modal-overlay">
        <div className="project-details-modal">
          <div className="loading">Loading project details...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-modal-overlay">
        <div className="project-details-modal">
          <div className="error">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-details-modal-overlay" onClick={onClose}>
      <div className="project-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project.projectName}</h2>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Project Overview */}
          <div className="section">
            <h3 className="section-title">Project Overview</h3>
            <div className="project-overview-grid">
              <div className="overview-card">
                <div className="card-icon" style={{ color: '#3b82f6' }}>
                  <FiUser />
                </div>
                <div className="card-content">
                  <p className="card-label">Client</p>
                  <p className="card-value">{project.clientId?.name}</p>
                  <p className="card-code">{project.clientId?.clientCode}</p>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon" style={{ color: '#8b5cf6' }}>
                  <FiTrendingUp />
                </div>
                <div className="card-content">
                  <p className="card-label">Project Type</p>
                  <p className="card-value">{project.projectType}</p>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon" style={{ color: '#ec4899' }}>
                  <FiCalendar />
                </div>
                <div className="card-content">
                  <p className="card-label">Status</p>
                  <p className="card-value">{project.status}</p>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon" style={{ color: '#f59e0b' }}>
                  <FiCalendar />
                </div>
                <div className="card-content">
                  <p className="card-label">Deadline</p>
                  <p className="card-value">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {project.description && (
              <div className="description-box">
                <h4>Description</h4>
                <p>{project.description}</p>
              </div>
            )}
          </div>

          {/* Payment Statistics */}
          {statistics && (
            <div className="section">
              <h3 className="section-title">Payment Status & Completion</h3>
              
              <div className="payment-progress">
                <div className="progress-header">
                  <span>Payment Completion</span>
                  <span className="progress-percentage">{statistics.paymentPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${statistics.paymentPercentage}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>₹{statistics.totalPaid.toLocaleString()} of ₹{statistics.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
                    <FiDollarSign style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Amount</p>
                    <p className="stat-value">₹{statistics.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
                    <FiCheckCircle style={{ color: '#10b981' }} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Paid</p>
                    <p className="stat-value">₹{statistics.totalPaid.toLocaleString()}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
                    <FiClock style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Pending Amount</p>
                    <p className="stat-value">₹{statistics.pendingAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#fecaca' }}>
                    <FiAlertCircle style={{ color: '#ef4444' }} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Failed Payments</p>
                    <p className="stat-value">{statistics.failedPayments}</p>
                  </div>
                </div>
              </div>

              <div className="payment-summary">
                <div className="summary-item">
                  <span>Total Payments:</span>
                  <strong>{statistics.totalPayments}</strong>
                </div>
                <div className="summary-item">
                  <span>Completed:</span>
                  <strong style={{ color: '#10b981' }}>{statistics.completedPayments}</strong>
                </div>
                <div className="summary-item">
                  <span>Pending:</span>
                  <strong style={{ color: '#f59e0b' }}>{statistics.pendingPayments}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="section">
            <h3 className="section-title">Payment History</h3>
            
            {payments.length === 0 ? (
              <div className="no-payments">
                <p>No payments recorded for this project</p>
              </div>
            ) : (
              <div className="payments-table-container">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Invoice</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const badge = getPaymentStatusBadge(payment.status);
                      return (
                        <tr key={payment._id} className={`payment-row ${payment.status}`}>
                          <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td className="amount">₹{payment.amount.toLocaleString()}</td>
                          <td>
                            <span className="method-badge">
                              {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: getStatusColor(payment.status),
                                color: 'white'
                              }}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                          </td>
                          <td>{payment.invoiceNumber || 'N/A'}</td>
                          <td className="details-cell">
                            {payment.description && (
                              <span title={payment.description} className="description-tooltip">
                                ℹ️
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Dates */}
          <div className="section">
            <h3 className="section-title">Project Dates</h3>
            <div className="dates-grid">
              <div className="date-item">
                <label>Start Date</label>
                <p>{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              {project.endDate && (
                <div className="date-item">
                  <label>End Date</label>
                  <p>{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.deadline && (
                <div className="date-item">
                  <label>Deadline</label>
                  <p>{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
