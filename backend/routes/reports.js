const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard overview
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Client stats
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });

    // Project stats
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const ongoingProjects = await Project.countDocuments({ status: 'in_progress' });
    const pendingProjects = await Project.countDocuments({ status: 'pending' });

    // Financial stats
    const totalEarnings = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);

    // Recent activity
    const recentClients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('clientId', 'name clientCode')
      .populate('projectId', 'projectName')
      .sort({ paymentDate: -1 })
      .limit(5);

    const recentProjects = await Project.find()
      .populate('clientId', 'name clientCode')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        clients: {
          total: totalClients,
          active: activeClients
        },
        projects: {
          total: totalProjects,
          completed: completedProjects,
          ongoing: ongoingProjects,
          pending: pendingProjects
        },
        financials: {
          totalEarnings: totalEarnings[0]?.total || 0,
          pendingPayments: pendingPayments[0]?.total || 0
        },
        recentActivity: {
          clients: recentClients,
          payments: recentPayments,
          projects: recentProjects
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/earnings
// @desc    Get earnings report
// @access  Private
router.get('/earnings', protect, async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy;
    if (period === 'yearly') {
      groupBy = { $year: '$paymentDate' };
    } else if (period === 'monthly') {
      groupBy = {
        year: { $year: '$paymentDate' },
        month: { $month: '$paymentDate' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$paymentDate' },
        week: { $week: '$paymentDate' }
      };
    }

    const earnings = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);

    const totalEarnings = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      period,
      year,
      earnings,
      total: totalEarnings[0]?.total || 0
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/pending
// @desc    Get pending payments report
// @access  Private
router.get('/pending', protect, async (req, res) => {
  try {
    const pendingProjects = await Project.find({ pendingAmount: { $gt: 0 } })
      .populate('clientId', 'name email clientCode phone')
      .sort({ deadline: 1 });

    const totalPending = pendingProjects.reduce((sum, project) => sum + project.pendingAmount, 0);

    // Group by client
    const byClient = {};
    pendingProjects.forEach(project => {
      const clientId = project.clientId._id.toString();
      if (!byClient[clientId]) {
        byClient[clientId] = {
          client: project.clientId,
          projects: [],
          totalPending: 0
        };
      }
      byClient[clientId].projects.push(project);
      byClient[clientId].totalPending += project.pendingAmount;
    });

    res.json({
      success: true,
      pendingPayments: {
        projects: pendingProjects,
        byClient: Object.values(byClient),
        totalPending
      }
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/projects
// @desc    Get project status report
// @access  Private
router.get('/projects', protect, async (req, res) => {
  try {
    const statusCounts = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    const priorityCounts = await Project.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const projectTypes = await Project.aggregate([
      {
        $group: {
          _id: '$projectType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      report: {
        byStatus: statusCounts,
        byPriority: priorityCounts,
        byType: projectTypes
      }
    });
  } catch (error) {
    console.error('Get project report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/clients
// @desc    Get client report
// @access  Private
router.get('/clients', protect, async (req, res) => {
  try {
    const topClients = await Client.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'clientId',
          as: 'projects'
        }
      },
      {
        $addFields: {
          projectCount: { $size: '$projects' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    const newClientsThisMonth = await Client.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const clientStatus = await Client.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      report: {
        topClients,
        newClientsThisMonth,
        byStatus: clientStatus
      }
    });
  } catch (error) {
    console.error('Get client report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
