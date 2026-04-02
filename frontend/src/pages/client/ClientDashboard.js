import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { FiUser, FiFolder, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle, FiCreditCard, FiArrowLeft, FiChevronDown } from 'react-icons/fi';

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(location.state?.clientData || null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [showAmountPanel, setShowAmountPanel] = useState(false);
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [showPaymentQr, setShowPaymentQr] = useState(false);

  useEffect(() => {
    if (!clientData) {
      navigate('/');
    }
  }, [clientData, navigate]);

  const handlePayment = async (project) => {
    if (project.pendingAmount <= 0) {
      toast.info('No pending payment for this project');
      return;
    }

    setPaymentLoading(project._id);

    try {
      // Create order
      const orderResponse = await axios.post('/api/payments/create-order', {
        clientId: clientData.client._id,
        projectId: project._id,
        amount: project.pendingAmount
      });

      if (!orderResponse.data.success) {
        toast.error('Failed to create payment order');
        return;
      }

      const { orderId, amount, paymentId } = orderResponse.data;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
          amount: amount,
          currency: 'INR',
          name: 'Client Management',
          description: `Payment for ${project.projectName}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              // Verify payment
              const verifyResponse = await axios.post('/api/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: paymentId
              });

              if (verifyResponse.data.success) {
                toast.success('Payment successful!');
                // Refresh client data
                const refreshResponse = await axios.get('/api/clients/search', {
                  params: { clientCode: clientData.client.clientCode }
                });
                if (refreshResponse.data.success) {
                  setClientData(refreshResponse.data);
                }
              } else {
                toast.error('Payment verification failed');
              }
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: clientData.client.name,
            email: clientData.client.email,
            contact: clientData.client.phone
          },
          theme: {
            color: '#000000'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleUPIPayment = async (project) => {
    if (project.pendingAmount <= 0) {
      toast.info('No pending payment for this project');
      return;
    }

    setPaymentLoading(project._id);

    try {
      const response = await axios.post('/api/payments/upi-link', {
        clientId: clientData.client._id,
        projectId: project._id,
        amount: project.pendingAmount
      });

      if (response.data.success) {
        window.open(response.data.paymentUrl, '_blank');
        toast.success('UPI payment link opened');
      } else {
        toast.error('Failed to create UPI link');
      }
    } catch (error) {
      toast.error('Failed to create UPI link');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleDownloadInvoice = (payment) => {
    const invoiceNumber = payment.invoiceNumber || `INV-${payment._id.substring(0, 8)}`;
    const project = projects.find((p) => p._id === payment.projectId) || {};
    const paymentDate = new Date(payment.paymentDate).toLocaleDateString();

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(22);
    doc.setTextColor('#111827');
    doc.text('INVOICE', margin, y);

    doc.setFontSize(12);
    doc.setTextColor('#374151');
    y += 30;
    doc.text(`Invoice Number: ${invoiceNumber}`, margin, y);
    y += 18;
    doc.text(`Date: ${paymentDate}`, margin, y);
    y += 18;
    doc.text(`Client: ${client.name} (${client.clientCode})`, margin, y);
    y += 18;
    doc.text(`Email: ${client.email}`, margin, y);
    y += 18;
    doc.text(`Project: ${project.projectName || 'N/A'}`, margin, y);
    y += 18;
    doc.text(`Project Type: ${project.projectType || 'N/A'}`, margin, y);

    y += 26;
    doc.setFontSize(14);
    doc.setTextColor('#111827');
    doc.text('Payment Details', margin, y);

    y += 20;
    doc.setFontSize(12);
    doc.text(`Amount Paid: ₹${payment.amount.toLocaleString()}`, margin, y);
    y += 18;
    doc.text(`Payment Method: ${payment.paymentMethod.replace('_', ' ')}`, margin, y);
    y += 18;
    doc.text(`Status: ${payment.status}`, margin, y);

    y += 26;
    doc.setFontSize(14);
    doc.text('Description', margin, y);

    y += 18;
    const description = payment.description || 'N/A';
    doc.setFontSize(12);
    const descriptionLines = doc.splitTextToSize(description, 520);
    doc.text(descriptionLines, margin, y);

    y += descriptionLines.length * 16 + 24;
    doc.setFontSize(10);
    doc.setTextColor('#6b7280');
    doc.text('Thank you for your business.', margin, y);

    doc.save(`${invoiceNumber}.pdf`);
  };

  if (!clientData) {
    return null;
  }

  const { client, projects, payments } = clientData;

  return (
    <div className="client-dashboard-page">
      <div className="dashboard-container">
        <button onClick={() => navigate('/')} className="back-btn">
          <FiArrowLeft />
          <span>Back to Search</span>
        </button>

        <div className="dashboard-header">
          <div className="client-info">
            <div className="client-avatar">
              <FiUser />
            </div>
            <div className="client-details">
              <h1>{client.name}</h1>
              <p className="client-code">Client Code: {client.clientCode}</p>
              <p className="client-email">{client.email}</p>
            </div>
          </div>
        </div>

        <div className="mobile-portal mobile-only">
          <div className="pixmos-card">
            <div className="pixmos-title">PIXMO<span>S</span> - CLIENT PORTAL</div>
            <div className="pixmos-info"><span>NAME</span> {client.name}</div>
            <div className="pixmos-info"><span>EMAIL/PH</span> {client.email} / {client.phone || 'N/A'}</div>
            <div className="pixmos-info"><span>WEBSITE</span> PIXMOS.COM</div>
          </div>

          <button className="mobile-toggle" onClick={() => setShowAmountPanel(!showAmountPanel)}>
            <FiDollarSign /> AMMOUNT <FiChevronDown className={showAmountPanel ? 'rotated' : ''} />
          </button>
          <div className={`mobile-panel ${showAmountPanel ? 'open' : ''}`}>
            <p>Total: ₹{client.totalAmount.toLocaleString()}</p>
            <p>Paid: ₹{client.paidAmount.toLocaleString()}</p>
            <p>Pending: ₹{client.pendingAmount.toLocaleString()}</p>
          </div>

          <button className="mobile-toggle" onClick={() => setShowProjectPanel(!showProjectPanel)}>
            <FiFolder /> PROJECT <FiChevronDown className={showProjectPanel ? 'rotated' : ''} />
          </button>
          <div className={`mobile-panel ${showProjectPanel ? 'open' : ''}`}>
            {projects.length === 0 ? (
              <p>No projects</p>
            ) : (
              projects.map((project) => (
                <div key={project._id} className="mobile-project-item">
                  <strong>{project.projectName}</strong>
                  <small>{project.status.replace('_', ' ')} • ₹{project.totalAmount.toLocaleString()}</small>
                </div>
              ))
            )}
          </div>

          <div className="payment-qr-card">
            <h2 className="payment-qr-title">PAYMENT QR</h2>
            <div className="payment-qr-content">
              <div className="payment-qr-image">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('upi://pay?pa=8700298734@fam&pn=sompushp')}`}
                  alt="payment QR"
                />
              </div>
              <div className="payment-qr-details">
                <div className="payment-qr-accept">ACCEPT -</div>
                <ul className="payment-qr-methods">
                  <li>Phonepe</li>
                  <li>Google pay</li>
                  <li>paytm</li>
                  <li>amazone pay</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="desktop-only" style={{ margin: '14px 0', display: 'flex', gap: '10px' }}>
          <button className="qr-toggle-btn" onClick={() => setShowPaymentQr((s) => !s)}>
            {showPaymentQr ? 'Hide Payment QR' : 'Show Payment QR'}
          </button>
          <button
            className="qr-open-btn"
            onClick={() => window.open(
              `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('upi://pay?pa=8700298734@fam&pn=sompushp')}`,
              '_blank'
            )}
          >
            Open QR
          </button>
        </div>

        {showPaymentQr && (
          <div className="payment-qr-card">
            <h2 className="payment-qr-title">PAYMENT QR</h2>
            <div className="payment-qr-content">
              <div className="payment-qr-image">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('upi://pay?pa=8700298734@fam&pn=sompushp')}`}
                  alt="payment QR"
                />
              </div>
              <div className="payment-qr-details">
                <div className="payment-qr-accept">ACCEPT -</div>
                <ul className="payment-qr-methods">
                  <li>Phonepe</li>
                  <li>Google pay</li>
                  <li>paytm</li>
                  <li>amazone pay</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <span className="stat-label">TOTAL AMOUNT</span>
              <span className="stat-value">₹{client.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon paid">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <span className="stat-label">PAID AMOUNT</span>
              <span className="stat-value">₹{client.paidAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <span className="stat-label">PENDING AMOUNT</span>
              <span className="stat-value">₹{client.pendingAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon projects">
              <FiFolder />
            </div>
            <div className="stat-content">
              <span className="stat-label">TOTAL PROJECT</span>
              <span className="stat-value">₹{projects.length}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">
            <FiFolder />
            <span>Projects</span>
          </h2>
          <div className="projects-list">
            {projects.length === 0 ? (
              <p className="no-data">No projects found</p>
            ) : (
              projects.map((project) => (
                <div key={project._id} className="project-card">
                  <div className="project-header">
                    <h3>{project.projectName}</h3>
                    <span className={`status-badge ${project.status}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="project-details">
                    <p><strong>Type:</strong> {project.projectType}</p>
                    <p><strong>Total:</strong> ₹{project.totalAmount.toLocaleString()}</p>
                    <p><strong>Paid:</strong> ₹{project.paidAmount.toLocaleString()}</p>
                    <p><strong>Pending:</strong> ₹{project.pendingAmount.toLocaleString()}</p>
                    {project.deadline && (
                      <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                    )}
                  </div>
                  {project.pendingAmount > 0 && (
                    <div className="project-actions">
                      <button
                        onClick={() => handlePayment(project)}
                        className="pay-btn razorpay"
                        disabled={paymentLoading === project._id}
                      >
                        <FiCreditCard />
                        <span>{paymentLoading === project._id ? 'Processing...' : 'Pay with Razorpay'}</span>
                      </button>
                      <button
                        onClick={() => handleUPIPayment(project)}
                        className="pay-btn upi"
                        disabled={paymentLoading === project._id}
                      >
                        <FiDollarSign />
                        <span>Pay with UPI</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">
            <FiClock />
            <span>Payment History</span>
          </h2>
          <div className="payments-list">
            {payments.length === 0 ? (
              <p className="no-data">No payment history</p>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Invoice File</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                            <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td>{payment.invoiceNumber || 'N/A'}</td>
                      <td>₹{payment.amount.toLocaleString()}</td>
                      <td>{payment.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                      <td>
                        <span className={`status-badge ${payment.status}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="download-btn"
                          onClick={() => handleDownloadInvoice(payment)}
                        >
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
