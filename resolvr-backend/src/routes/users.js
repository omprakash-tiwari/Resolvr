/**
 * User Routes
 * Handles user listing and management
 */

const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (for assigning issues, adding to projects)
 */
router.get('/', async (req, res) => {
  try {
    const { search, role, isOnCall } = req.query;

    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (isOnCall !== undefined) filter.isOnCall = isOnCall === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(100);

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users'
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user profile
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user'
    });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const Issue = require('../models/Issue');
    const Incident = require('../models/Incident');

    const userId = req.params.id;

    // Get issue stats
    const issuesCreated = await Issue.countDocuments({ reporter: userId });
    const issuesAssigned = await Issue.countDocuments({ assignee: userId });
    const issuesResolved = await Issue.countDocuments({
      assignee: userId,
      status: 'resolved'
    });

    // Get incident stats
    const incidentsAcknowledged = await Incident.countDocuments({
      acknowledgedBy: userId
    });

    const user = await User.findById(userId).select('averageResponseTime acknowledgedIncidents');

    res.json({
      stats: {
        issuesCreated,
        issuesAssigned,
        issuesResolved,
        incidentsAcknowledged,
        averageResponseTime: user?.averageResponseTime || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to get user stats'
    });
  }
});

module.exports = router;
