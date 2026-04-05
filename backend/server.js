const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
  console.error('Please set your MongoDB Atlas connection string in environment variables.');
  process.exit(1);
}

// Validate MongoDB URI format
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
  console.error('❌ ERROR: Invalid MONGODB_URI format!');
  console.error('URI must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

// Check for common issues
if (mongoURI.includes(' ')) {
  console.error('❌ ERROR: MONGODB_URI contains spaces!');
  console.error('Remove all spaces from the connection string.');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB Atlas...');
// Safely log URI (hide credentials)
const sanitizedURI = mongoURI.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3');
console.log('📍 Database URL:', sanitizedURI);

// Database Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully to Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    
    // Check for specific error types
    if (err.message.includes('authentication failed') || err.message.includes('invalid candidate')) {
      console.error('\n🔍 Possible causes:');
      console.error('1. Username/password is incorrect');
      console.error('2. Special characters (@, :, #, etc.) in password need URL encoding');
      console.error('   Example: p@ssword → p%40ssword');
      console.error('3. Database user does not exist in MongoDB Atlas');
      console.error('\n💡 Fix: Go to MongoDB Atlas → Database Access → Reset password');
      console.error('   Use only alphanumeric characters in password to avoid encoding issues.');
    }
    
    if (err.message.includes('IP')) {
      console.error('\n🔍 Your IP is not whitelisted in MongoDB Atlas!');
      console.error('💡 Fix: MongoDB Atlas → Network Access → Add IP Address → 0.0.0.0/0');
    }
    
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Home Route (fix Cannot GET /)
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
