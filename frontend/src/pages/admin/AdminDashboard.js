import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUsers, FiFolder, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="error-container">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  const { clients, projects, financials, recentActivity } = dashboardData;

  const projectStatusData = {
    labels: ['Completed', 'Ongoing', 'Pending'],
    datasets: [
      {
        data: [projects.completed, projects.ongoing, projects.pending],
        backgroundColor: ['#000000', '#666666', '#cccccc'],
        borderColor: ['#000000', '#666666', '#cccccc'],
        borderWidth: 1,
      },
    ],
  };

  const earningsData = {
    labels: ['Total Earnings', 'Pending Payments'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [financials.totalEarnings, financials.pendingPayments],
        backgroundColor: ['#000000', '#666666'],
      },
    ],
  };

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's an overview of your business.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon clients">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>Total Clients</h3>
              <p className="stat-value">{clients.total}</p>
              <p className="stat-label">{clients.active} active</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon projects">
              <FiFolder />
            </div>
            <div className="stat-content">
              <h3>Total Projects</h3>
              <p className="stat-value">{projects.total}</p>
              <p className="stat-label">{projects.completed} completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon earnings">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <h3>Total Earnings</h3>
              <p className="stat-value">₹{financials.totalEarnings.toLocaleString()}</p>
              <p className="stat-label">All time</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <h3>Pending Payments</h3>
              <p className="stat-value">₹{financials.pendingPayments.toLocaleString()}</p>
              <p className="stat-label">To be collected</p>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Project Status</h3>
            <div className="chart-container">
              <Doughnut
                data={projectStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="chart-card">
            <h3>Financial Overview</h3>
            <div className="chart-container">
              <Bar
                data={earningsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="recent-activity-grid">
          <div className="activity-card">
            <h3>
              <FiUsers />
              <span>Recent Clients</span>
            </h3>
            <div className="activity-list">
              {recentActivity.clients.length === 0 ? (
                <p className="no-data">No recent clients</p>
              ) : (
                recentActivity.clients.map((client) => (
                  <div key={client._id} className="activity-item">
                    <div className="activity-info">
                      <p className="activity-name">{client.name}</p>
                      <p className="activity-detail">{client.clientCode}</p>
                    </div>
                    <p className="activity-date">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="activity-card">
            <h3>
              <FiDollarSign />
              <span>Recent Payments</span>
            </h3>
            <div className="activity-list">
              {recentActivity.payments.length === 0 ? (
                <p className="no-data">No recent payments</p>
              ) : (
                recentActivity.payments.map((payment) => (
                  <div key={payment._id} className="activity-item">
                    <div className="activity-info">
                      <p className="activity-name">
                        {payment.clientId?.name || 'Unknown'}
                      </p>
                      <p className="activity-detail">
                        {payment.projectId?.projectName || 'Unknown'}
                      </p>
                    </div>
                    <div className="activity-amount">
                      <p className="amount">₹{payment.amount.toLocaleString()}</p>
                      <p className="activity-date">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="activity-card">
            <h3>
              <FiFolder />
              <span>Recent Projects</span>
            </h3>
            <div className="activity-list">
              {recentActivity.projects.length === 0 ? (
                <p className="no-data">No recent projects</p>
              ) : (
                recentActivity.projects.map((project) => (
                  <div key={project._id} className="activity-item">
                    <div className="activity-info">
                      <p className="activity-name">{project.projectName}</p>
                      <p className="activity-detail">
                        {project.clientId?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`status-badge ${project.status}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
