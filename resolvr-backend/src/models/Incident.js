/**
 * Incident Model
 * Represents critical incidents that require immediate attention (xMatters-like)
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'escalated'],
    default: 'active'
  },
  severity: {
    type: String,
    enum: ['critical', 'blocker'],
    default: 'critical'
  },
  // Who triggered the incident
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who acknowledged it
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  // Response time in seconds
  responseTime: Number,
  // Escalation chain
  escalations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notifiedAt: Date,
    method: {
      type: String,
      enum: ['push', 'sms', 'call']
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  // Current escalation level
  escalationLevel: {
    type: Number,
    default: 0
  },
  // Next escalation time
  nextEscalationAt: Date,
  // Resolution details
  resolvedAt: Date,
  resolutionNotes: String,
  // Notification attempts
  notificationsSent: {
    type: Number,
    default: 0
  },
  // Alert message
  alertMessage: String,
  // Impact description
  impactDescription: String
}, {
  timestamps: true
});

// Indexes
incidentSchema.index({ status: 1 });
incidentSchema.index({ project: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });

// Calculate response time when acknowledged
incidentSchema.pre('save', function(next) {
  if (this.isModified('acknowledgedAt') && this.acknowledgedAt) {
    this.responseTime = Math.floor((this.acknowledgedAt - this.createdAt) / 1000);
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
