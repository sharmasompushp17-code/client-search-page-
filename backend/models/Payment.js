const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'bank_transfer', 'cash', 'other'],
    default: 'razorpay'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  upiId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    unique: true
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

// Generate invoice number before saving
paymentSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Payment').countDocuments();
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Update project and client paid amounts after payment is completed
paymentSchema.post('save', async function() {
  if (this.status === 'completed') {
    const Project = mongoose.model('Project');
    const Client = mongoose.model('Client');
    
    const project = await Project.findById(this.projectId);
    if (project) {
      project.paidAmount += this.amount;
      project.pendingAmount = project.totalAmount - project.paidAmount;
      await project.save();
    }
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
