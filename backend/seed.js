const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin');

const seedAdmin = async () => {
  try {
    // Check for required environment variables
    if (!process.env.MONGODB_URI) {
      console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
      console.error('Please set your MongoDB Atlas connection string in environment variables.');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📍 Database URL:', process.env.MONGODB_URI.replace(/:.*@/, ':****@'));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected to Atlas');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });

    console.log('Admin created successfully');
    console.log('Email:', admin.email);
    console.log('Password: (hidden for security)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
