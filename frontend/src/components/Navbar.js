import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiHome, FiUsers, FiFolder, FiCreditCard, FiBarChart2, FiLogOut, FiUser } from 'react-icons/fi';

const Navbar = () => {
  const { isAuthenticated, admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = isAuthenticated ? [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/admin/clients', label: 'Clients', icon: <FiUsers /> },
    { path: '/admin/projects', label: 'Projects', icon: <FiFolder /> },
    { path: '/admin/payments', label: 'Payments', icon: <FiCreditCard /> },
    { path: '/admin/reports', label: 'Reports', icon: <FiBarChart2 /> },
  ] : [];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">ClientManager</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="nav-user">
                <FiUser />
                <span>{admin?.name}</span>
                <button onClick={handleLogout} className="nav-logout-btn">
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="navbar-mobile">
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="nav-user-mobile">
                <FiUser />
                <span>{admin?.name}</span>
                <button onClick={handleLogout} className="nav-logout-btn">
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
