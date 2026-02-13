/**
 * Notification Routes
 * Handles in-app notifications
 */

const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get all notifications for current user
 */
router.get('/', async (req, res) => {
  try {
    const { isRead, limit = 50 } = req.query;

    const filter = { user: req.userId };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .populate('issue', 'key title')
      .populate('project', 'name key')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      isRead: false
    });

    res.json({
      notifications,
      unreadCount,
      count: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      message: 'All notifications marked as read',
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification'
    });
  }
});

module.exports = router;
