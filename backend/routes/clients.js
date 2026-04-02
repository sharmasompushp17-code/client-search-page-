const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// @route   GET /api/clients/search
// @desc    Search client by code and/or name for authentication
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { clientCode, clientName } = req.query;

    if (!clientCode && !clientName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide client code or name'
      });
    }

    let query = {};

    if (clientCode) {
      query.clientCode = clientCode.toUpperCase();
    }

    if (clientName) {
      // If both clientCode and clientName are provided, require exact match for security
      if (clientCode) {
        query.name = clientName; // Exact match when both are provided
      } else {
        query.name = { $regex: clientName, $options: 'i' }; // Regex search when only name provided
      }
    }

    const client = await Client.findOne(query);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get projects and payments
    const projects = await Project.find({ clientId: client._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ clientId: client._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      client,
      projects,
      payments
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/clients
// @desc    Get all clients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Client.countDocuments(query);

    res.json({
      success: true,
      clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const projects = await Project.find({ clientId: client._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ clientId: client._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      client,
      projects,
      payments
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/clients
// @desc    Create new client
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;

const clientCode = require('crypto')
  .randomBytes(4)
  .toString('hex')
  .toUpperCase();

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and phone'
      });
    }

    // Check if email already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const client = await Client.create({
      clientCode,
      name,
      email,
      phone,
      company,
      address,
      notes
    });

    // Send welcome email (optional - don't fail if email config is missing)
    try {
      const emailTemplate = emailTemplates.welcome(client.name, client.clientCode);
      await sendEmail({
        to: client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
    } catch (emailError) {
      console.log('Welcome email not sent (email not configured):', emailError.message);
    }

    res.status(201).json({
      success: true,
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, email, phone, company, address, status, notes } = req.body;

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ email });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Client with this email already exists'
        });
      }
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, company, address, status, notes },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      client: updatedClient
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Delete associated projects and payments
    await Project.deleteMany({ clientId: client._id });
    await Payment.deleteMany({ clientId: client._id });
    await Client.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Client and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/clients/recent/list
// @desc    Get recent clients
// @access  Private
router.get('/recent/list', protect, async (req, res) => {
  try {
    const clients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      clients
    });
  } catch (error) {
    console.error('Get recent clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
