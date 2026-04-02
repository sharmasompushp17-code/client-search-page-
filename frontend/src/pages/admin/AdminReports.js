import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiDollarSign, FiFolder, FiUsers, FiTrendingUp, FiAlertCircle, FiDownload } from 'react-icons/fi';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [projectReport, setProjectReport] = useState(null);
  const [clientReport, setClientReport] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAllReports();
  }, [selectedYear]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [dashboardRes, earningsRes, pendingRes, projectRes, clientRes] = await Promise.all([
        axios.get('/api/reports/dashboard'),
        axios.get('/api/reports/earnings', { params: { year: selectedYear } }),
        axios.get('/api/reports/pending'),
        axios.get('/api/reports/projects'),
        axios.get('/api/reports/clients')
      ]);

      if (dashboardRes.data.success) setDashboardData(dashboardRes.data.dashboard);
      if (earningsRes.data.success) setEarningsData(earningsRes.data);
      if (pendingRes.data.success) setPendingData(pendingRes.data.pendingPayments);
      if (projectRes.data.success) setProjectReport(projectRes.data.report);
      if (clientRes.data.success) setClientReport(clientRes.data.report);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (reportType) => {
    let data = '';
    let filename = '';

    switch (reportType) {
      case 'earnings':
        data = `Earnings Report - ${selectedYear}\n\n`;
        data += `Total Earnings: ₹${earningsData?.total?.toLocaleString() || 0}\n\n`;
        data += `Monthly Breakdown:\n`;
        earningsData?.earnings?.forEach(item => {
          data += `Month ${item._id.month}: ₹${item.total.toLocaleString()} (${item.count} payments)\n`;
        });
        filename = `Earnings-Report-${selectedYear}.txt`;
        break;

      case 'pending':
        data = `Pending Payments Report\n\n`;
        data += `Total Pending: ₹${pendingData?.totalPending?.toLocaleString() || 0}\n\n`;
        data += `By Client:\n`;
        pendingData?.byClient?.forEach(item => {
          data += `${item.client.name} (${item.client.clientCode}): ₹${item.totalPending.toLocaleString()}\n`;
          item.projects.forEach(proj => {
            data += `  - ${proj.projectName}: ₹${proj.pendingAmount.toLocaleString()}\n`;
          });
        });
        filename = `Pending-Payments-Report.txt`;
        break;

      case 'projects':
        data = `Project Status Report\n\n`;
        data += `By Status:\n`;
        projectReport?.byStatus?.forEach(item => {
          data += `${item._id}: ${item.count} projects (Total: ₹${item.totalAmount.toLocaleString()}, Paid: ₹${item.paidAmount.toLocaleString()}, Pending: ₹${item.pendingAmount.toLocaleString()})\n`;
        });
        data += `\nBy Type:\n`;
        projectReport?.byType?.forEach(item => {
          data += `${item._id}: ${item.count} projects (Total: ₹${item.totalAmount.toLocaleString()})\n`;
        });
        filename = `Project-Report.txt`;
        break;

      default:
        return;
    }

    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  const projectStatusData = {
    labels: ['Completed', 'Ongoing', 'Pending'],
    datasets: [
      {
        data: [
          dashboardData?.projects?.completed || 0,
          dashboardData?.projects?.ongoing || 0,
          dashboardData?.projects?.pending || 0
        ],
        backgroundColor: ['#000000', '#666666', '#cccccc'],
        borderWidth: 1,
      },
    ],
  };

  const monthlyEarningsData = {
    labels: earningsData?.earnings?.map(item => `Month ${item._id.month}`) || [],
    datasets: [
      {
        label: 'Earnings (₹)',
        data: earningsData?.earnings?.map(item => item.total) || [],
        backgroundColor: '#000000',
        borderColor: '#000000',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="admin-reports-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Reports & Analytics</h1>
            <p>Comprehensive business insights and analytics</p>
          </div>
          <div className="year-selector">
            <label>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Payments
          </button>
          <button
            className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            Clients
          </button>
        </div>

        <div className="report-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon clients">
                    <FiUsers />
                  </div>
                  <div className="stat-content">
                    <h3>Total Clients</h3>
                    <p className="stat-value">{dashboardData?.clients?.total || 0}</p>
                    <p className="stat-label">{dashboardData?.clients?.active || 0} active</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon projects">
                    <FiFolder />
                  </div>
                  <div className="stat-content">
                    <h3>Total Projects</h3>
                    <p className="stat-value">{dashboardData?.projects?.total || 0}</p>
                    <p className="stat-label">{dashboardData?.projects?.completed || 0} completed</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon earnings">
                    <FiDollarSign />
                  </div>
                  <div className="stat-content">
                    <h3>Total Earnings</h3>
                    <p className="stat-value">₹{(dashboardData?.financials?.totalEarnings || 0).toLocaleString()}</p>
                    <p className="stat-label">All time</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon pending">
                    <FiAlertCircle />
                  </div>
                  <div className="stat-content">
                    <h3>Pending Payments</h3>
                    <p className="stat-value">₹{(dashboardData?.financials?.pendingPayments || 0).toLocaleString()}</p>
                    <p className="stat-label">To be collected</p>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Project Status Distribution</h3>
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
                  <h3>Monthly Earnings ({selectedYear})</h3>
                  <div className="chart-container">
                    <Bar
                      data={monthlyEarningsData}
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
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="earnings-tab">
              <div className="report-header">
                <h2>Earnings Report - {selectedYear}</h2>
                <button onClick={() => downloadReport('earnings')} className="download-btn">
                  <FiDownload />
                  <span>Download Report</span>
                </button>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <h4>Total Earnings</h4>
                  <p className="amount">₹{(earningsData?.total || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="chart-card">
                <h3>Monthly Earnings</h3>
                <div className="chart-container">
                  <Line
                    data={monthlyEarningsData}
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

              <div className="data-table">
                <h3>Monthly Breakdown</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData?.earnings?.map((item, index) => (
                      <tr key={index}>
                        <td>Month {item._id.month}</td>
                        <td>₹{item.total.toLocaleString()}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="pending-tab">
              <div className="report-header">
                <h2>Pending Payments Report</h2>
                <button onClick={() => downloadReport('pending')} className="download-btn">
                  <FiDownload />
                  <span>Download Report</span>
                </button>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <h4>Total Pending</h4>
                  <p className="amount">₹{(pendingData?.totalPending || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="data-table">
                <h3>Pending by Client</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Code</th>
                      <th>Pending Amount</th>
                      <th>Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingData?.byClient?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.client.name}</td>
                        <td>{item.client.clientCode}</td>
                        <td>₹{item.totalPending.toLocaleString()}</td>
                        <td>{item.projects.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="projects-tab">
              <div className="report-header">
                <h2>Project Report</h2>
                <button onClick={() => downloadReport('projects')} className="download-btn">
                  <FiDownload />
                  <span>Download Report</span>
                </button>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>By Status</h3>
                  <div className="chart-container">
                    <Doughnut
                      data={{
                        labels: projectReport?.byStatus?.map(item => item._id) || [],
                        datasets: [{
                          data: projectReport?.byStatus?.map(item => item.count) || [],
                          backgroundColor: ['#000000', '#666666', '#cccccc', '#999999', '#333333'],
                        }]
                      }}
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
                  <h3>By Type</h3>
                  <div className="chart-container">
                    <Bar
                      data={{
                        labels: projectReport?.byType?.map(item => item._id) || [],
                        datasets: [{
                          label: 'Projects',
                          data: projectReport?.byType?.map(item => item.count) || [],
                          backgroundColor: '#000000',
                        }]
                      }}
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

              <div className="data-table">
                <h3>By Status</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Total Amount</th>
                      <th>Paid</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectReport?.byStatus?.map((item, index) => (
                      <tr key={index}>
                        <td>{item._id}</td>
                        <td>{item.count}</td>
                        <td>₹{item.totalAmount.toLocaleString()}</td>
                        <td>₹{item.paidAmount.toLocaleString()}</td>
                        <td>₹{item.pendingAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="clients-tab">
              <div className="report-header">
                <h2>Client Report</h2>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <h4>New Clients This Month</h4>
                  <p className="amount">{clientReport?.newClientsThisMonth || 0}</p>
                </div>
              </div>

              <div className="data-table">
                <h3>Top Clients by Revenue</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Code</th>
                      <th>Total Amount</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientReport?.topClients?.map((client, index) => (
                      <tr key={index}>
                        <td>{client.name}</td>
                        <td>{client.clientCode}</td>
                        <td>₹{client.totalAmount.toLocaleString()}</td>
                        <td>₹{client.paidAmount.toLocaleString()}</td>
                        <td>₹{client.pendingAmount.toLocaleString()}</td>
                        <td>{client.projectCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
