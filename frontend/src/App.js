import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Client Pages
import ClientSearch from './pages/client/ClientSearch';
import ClientDashboard from './pages/client/ClientDashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminProjects from './pages/admin/AdminProjects';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReports from './pages/admin/AdminReports';

// Components
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Context
import { AuthProvider } from './context/AuthContext';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<ClientSearch />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <PrivateRoute>
                  <AdminClients />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <PrivateRoute>
                  <AdminProjects />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <PrivateRoute>
                  <AdminPayments />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <PrivateRoute>
                  <AdminReports />
                </PrivateRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
