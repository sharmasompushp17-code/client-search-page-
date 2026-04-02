const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Client Management" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  newProject: (clientName, projectName, projectType, amount) => ({
    subject: `New Project Added - ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">New Project Added</h2>
        <p>Dear ${clientName},</p>
        <p>A new project has been added to your account:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Project Name:</strong> ${projectName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
        </div>
        <p>You can view your project details using your client code.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `
  }),

  paymentReceived: (clientName, amount, projectName, invoiceNumber) => ({
    subject: `Payment Received - ${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Payment Received</h2>
        <p>Dear ${clientName},</p>
        <p>We have received your payment:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        </div>
        <p>Thank you for your payment!</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `
  }),

  paymentPending: (clientName, pendingAmount, projectName) => ({
    subject: `Payment Reminder - ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Payment Reminder</h2>
        <p>Dear ${clientName},</p>
        <p>This is a friendly reminder about your pending payment:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Pending Amount:</strong> ₹${pendingAmount.toLocaleString()}</p>
        </div>
        <p>Please make the payment at your earliest convenience.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `
  }),

  welcome: (clientName, clientCode) => ({
    subject: 'Welcome to Client Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Welcome!</h2>
        <p>Dear ${clientName},</p>
        <p>Your account has been created successfully.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Your Client Code:</strong> ${clientCode}</p>
        </div>
        <p>Use this code to access your dashboard and view your projects and payments.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
