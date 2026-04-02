const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');
const { createOrder, verifyPaymentSignature, createUPILink } = require('../utils/razorpay');
const { sendEmail, emailTemplates } = require('../utils/email');

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, clientId, projectId, page = 1, limit = 10 } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (projectId) {
      query.projectId = projectId;
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'name email clientCode')
      .populate('projectId', 'projectName projectType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('clientId', 'name email clientCode phone')
      .populate('projectId', 'projectName projectType totalAmount');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Public
router.post('/create-order', async (req, res) => {
  try {
    const { clientId, projectId, amount } = req.body;

    if (!clientId || !projectId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify client and project exist
    const client = await Client.findById(clientId);
    const project = await Project.findById(projectId);

    if (!client || !project) {
      return res.status(404).json({
        success: false,
        message: 'Client or project not found'
      });
    }

    // Create Razorpay order
    const orderResult = await createOrder(amount, 'INR', `order_${projectId}_${Date.now()}`);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      clientId,
      projectId,
      amount,
      razorpayOrderId: orderResult.orderId,
      status: 'pending'
    });

    res.json({
      success: true,
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    await payment.save();

    // Get client and project for email
    const client = await Client.findById(payment.clientId);
    const project = await Project.findById(payment.projectId);

    // Send payment confirmation email (optional - don't fail if email config is missing)
    try {
      const emailTemplate = emailTemplates.paymentReceived(
        client.name,
        payment.amount,
        project.projectName,
        payment.invoiceNumber
      );
      await sendEmail({
        to: client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
    } catch (emailError) {
      console.log('Payment confirmation email not sent (email not configured):', emailError.message);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/upi-link
// @desc    Create UPI payment link
// @access  Public
router.post('/upi-link', async (req, res) => {
  try {
    const { clientId, projectId, amount } = req.body;

    if (!clientId || !projectId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const client = await Client.findById(clientId);
    const project = await Project.findById(projectId);

    if (!client || !project) {
      return res.status(404).json({
        success: false,
        message: 'Client or project not found'
      });
    }

    // Create UPI payment link
    const upiResult = await createUPILink(
      amount,
      `Payment for ${project.projectName}`,
      client.email,
      client.phone
    );

    if (!upiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create UPI link'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      clientId,
      projectId,
      amount,
      paymentMethod: 'upi',
      status: 'pending'
    });

    res.json({
      success: true,
      paymentLinkId: upiResult.paymentLinkId,
      paymentUrl: upiResult.shortUrl,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create UPI link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/manual
// @desc    Add manual payment
// @access  Private
router.post('/manual', protect, async (req, res) => {
  try {
    const { clientId, projectId, amount, paymentMethod, description, notes } = req.body;

    if (!clientId || !projectId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const client = await Client.findById(clientId);
    const project = await Project.findById(projectId);

    if (!client || !project) {
      return res.status(404).json({
        success: false,
        message: 'Client or project not found'
      });
    }

    const payment = await Payment.create({
      clientId,
      projectId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      description,
      notes,
      status: 'completed'
    });

    // Send payment confirmation email (optional - don't fail if email config is missing)
    try {
      const emailTemplate = emailTemplates.paymentReceived(
        client.name,
        amount,
        project.projectName,
        payment.invoiceNumber
      );
      await sendEmail({
        to: client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
    } catch (emailError) {
      console.log('Payment confirmation email not sent (email not configured):', emailError.message);
    }

    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Add manual payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/stats/overview
// @desc    Get payment statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyPayments = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const paymentMethods = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyPayments,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
