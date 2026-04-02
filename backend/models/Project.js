const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Amount cannot be negative']
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  deadline: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
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

// Calculate pending amount before saving
projectSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  this.updatedAt = Date.now();
  next();
});

// Update client totals after saving
projectSchema.post('save', async function() {
  const Client = mongoose.model('Client');
  const client = await Client.findById(this.clientId);
  
  if (client) {
    const projects = await mongoose.model('Project').find({ clientId: this.clientId });
    
    client.totalAmount = projects.reduce((sum, proj) => sum + proj.totalAmount, 0);
    client.paidAmount = projects.reduce((sum, proj) => sum + proj.paidAmount, 0);
    client.pendingAmount = client.totalAmount - client.paidAmount;
    
    await client.save();
  }
});

module.exports = mongoose.model('Project', projectSchema);
