/**
 * Notification Model
 * Tracks all notifications sent to users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['issue_assigned', 'issue_updated', 'comment_added', 'incident_alert', 'escalation', 'mention'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Related resources
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  // Priority (for sorting)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Action URL (deep link in mobile app)
  actionUrl: String,
  // Delivery method
  deliveryMethod: {
    type: String,
    enum: ['push', 'in-app', 'sms', 'email'],
    default: 'in-app'
  },
  // Delivery status
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
