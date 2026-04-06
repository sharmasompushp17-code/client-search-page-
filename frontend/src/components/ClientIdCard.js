import React from 'react';
import './ClientIdCard.css';

const ClientIdCard = ({ client }) => {
  const { name, email, phone, clientCode, avatar } = client;

  return (
    <div className="client-id-card">
      <div className="card-border">
        <div className="card-header-accent"></div>
        
        <div className="card-content">
          {/* Left Side - Avatar */}
          <div className="avatar-section">
            <div className="avatar-frame">
              <img 
                src={avatar || '/default-avatar.png'} 
                alt={name}
                className="avatar-img"
              />
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="info-section">
            {/* Name */}
            <div className="info-row">
              <span className="info-label">NAME</span>
              <div className="info-line"></div>
              <span className="info-value">{name?.toUpperCase() || 'N/A'}</span>
            </div>

            {/* Email */}
            <div className="info-row">
              <span className="info-label">EMAIL</span>
              <div className="info-line"></div>
              <span className="info-value">{email?.toUpperCase() || 'N/A'}</span>
            </div>

            {/* Phone */}
            <div className="info-row">
              <span className="info-label">PHONE</span>
              <div className="info-line"></div>
              <span className="info-value">{phone || 'N/A'}</span>
            </div>

            {/* Client Code */}
            <div className="info-row">
              <span className="info-label">CLIENT ID</span>
              <div className="info-line"></div>
              <span className="info-value client-code">{clientCode || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="card-footer-accent"></div>
      </div>
    </div>
  );
};

export default ClientIdCard;
