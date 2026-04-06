

const mongoose = require('mongoose');
const crypto = require('crypto');

const clientSchema = new mongoose.Schema({
  clientCode: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique client code before saving
clientSchema.pre('save', async function(next) {
  if (!this.clientCode) {
    let isUnique = false;
    let code;
    
    while (!isUnique) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existingClient = await mongoose.model('Client').findOne({ clientCode: code });
      if (!existingClient) {
        isUnique = true;
      }
    }
    
    this.clientCode = code;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Calculate pending amount
clientSchema.methods.calculatePendingAmount = function() {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.pendingAmount;
};

module.exports = mongoose.model('Client', clientSchema);
