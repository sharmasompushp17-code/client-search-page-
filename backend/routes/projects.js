const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, clientId, search, page = 1, limit = 10 } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectType: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('clientId', 'name email clientCode')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/projects/:id/details
// @desc    Get project details with payment history
// @access  Private
router.get('/:id/details', protect, async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email clientCode phone');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get all payments for this project
    const payments = await Payment.find({ projectId: req.params.id })
      .sort({ paymentDate: -1 })
      .populate('clientId', 'name email');

    // Calculate statistics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const paymentPercentage = project.totalAmount > 0 ? (totalPaid / project.totalAmount) * 100 : 0;

    res.json({
      success: true,
      project,
      payments,
      statistics: {
        totalAmount: project.totalAmount,
        totalPaid: totalPaid,
        pendingAmount: project.totalAmount - totalPaid,
        paymentPercentage: Math.round(paymentPercentage),
        totalPayments: payments.length,
        completedPayments: completedPayments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        failedPayments: payments.filter(p => p.status === 'failed').length
      }
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email clientCode phone');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { clientId, projectName, projectType, description, totalAmount, startDate, deadline, priority, notes } = req.body;

    // Validate required fields
    if (!clientId || !projectName || !projectType || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const project = await Project.create({
      clientId,
      projectName,
      projectType,
      description,
      totalAmount,
      startDate,
      deadline,
      priority,
      notes
    });

    // Send email notification (optional - don't fail if email config is missing)
    try {
      const emailTemplate = emailTemplates.newProject(client.name, projectName, projectType, totalAmount);
      await sendEmail({
        to: client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
    } catch (emailError) {
      console.log('Project email not sent (email not configured):', emailError.message);
    }

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { projectName, projectType, description, totalAmount, status, startDate, endDate, deadline, priority, notes } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName, projectType, description, totalAmount, status, startDate, endDate, deadline, priority, notes },
      { new: true, runValidators: true }
    ).populate('clientId', 'name email clientCode');

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/projects/stats/overview
// @desc    Get project statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const ongoingProjects = await Project.countDocuments({ status: 'in_progress' });
    const pendingProjects = await Project.countDocuments({ status: 'pending' });

    const totalAmount = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const paidAmount = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProjects,
        completedProjects,
        ongoingProjects,
        pendingProjects,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
        pendingAmount: (totalAmount[0]?.total || 0) - (paidAmount[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
