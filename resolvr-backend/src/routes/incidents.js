/**
 * Incident Routes (xMatters-like)
 * Handles critical incident escalation and acknowledgment
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushNotification, sendSMS } = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/incidents
 * Create a new critical incident from an issue
 */
router.post('/', [
  body('issueId').notEmpty().withMessage('Issue ID is required'),
  body('alertMessage').optional().trim(),
  body('impactDescription').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { issueId, alertMessage, impactDescription } = req.body;

    // Get issue
    const issue = await Issue.findById(issueId).populate('project');
    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    // Check if incident already exists for this issue
    const existingIncident = await Incident.findOne({
      issue: issueId,
      status: { $in: ['active', 'escalated'] }
    });

    if (existingIncident) {
      return res.status(400).json({
        error: 'Active incident already exists for this issue'
      });
    }

    // Upgrade issue to critical
    issue.type = 'incident';
    issue.priority = 'critical';
    issue.severity = 'critical';
    await issue.save();

    // Get project
    const project = await Project.findById(issue.project).populate('onCallUsers');

    // Create incident
    const incident = new Incident({
      issue: issueId,
      project: issue.project,
      triggeredBy: req.userId,
      alertMessage: alertMessage || `CRITICAL: ${issue.title}`,
      impactDescription: impactDescription || issue.description,
      status: 'active',
      nextEscalationAt: new Date(Date.now() + (parseInt(process.env.ESCALATION_TIMEOUT_MINUTES) || 5) * 60000)
    });

    // Get on-call users or all project members
    let targetUsers = project.onCallUsers && project.onCallUsers.length > 0
      ? project.onCallUsers
      : await User.find({ _id: { $in: project.members }, isOnCall: true });

    // If no on-call users, notify all project members
    if (targetUsers.length === 0) {
      targetUsers = await User.find({ _id: { $in: project.members } });
    }

    // Send alerts to on-call users
    for (const user of targetUsers) {
      // Create notification
      const notification = new Notification({
        user: user._id,
        type: 'incident_alert',
        title: '🚨 CRITICAL INCIDENT',
        message: incident.alertMessage,
        issue: issueId,
        incident: incident._id,
        project: issue.project,
        priority: 'critical',
        actionUrl: `/incidents/${incident._id}`,
        deliveryMethod: 'push'
      });
      await notification.save();

      // Track escalation
      incident.escalations.push({
        user: user._id,
        notifiedAt: new Date(),
        method: 'push',
        acknowledged: false
      });

      // Send push notification
      if (user.fcmToken) {
        await sendPushNotification(user.fcmToken, {
          title: '🚨 CRITICAL INCIDENT',
          body: incident.alertMessage,
          data: {
            type: 'incident',
            incidentId: incident._id.toString(),
            issueId: issueId.toString()
          }
        });
        notification.delivered = true;
        notification.deliveredAt = new Date();
        await notification.save();
      }

      // Send SMS if phone available (optional)
      if (user.phone) {
        try {
          await sendSMS(user.phone, `🚨 CRITICAL INCIDENT: ${incident.alertMessage}. Acknowledge in Resolvr app.`);
        } catch (smsError) {
          console.error('SMS send error:', smsError);
        }
      }

      // Emit real-time notification
      req.app.get('io').to(`user_${user._id}`).emit('incident_alert', {
        incident,
        issue,
        notification
      });
    }

    incident.notificationsSent = targetUsers.length;
    await incident.save();

    // Start escalation timer
    scheduleEscalation(incident._id, req.app.get('io'));

    res.status(201).json({
      message: 'Critical incident created and alerts sent',
      incident,
      alertsSent: targetUsers.length
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({
      error: 'Failed to create incident'
    });
  }
});

/**
 * POST /api/incidents/:id/acknowledge
 * Acknowledge an incident (stops escalation)
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('issue project');

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    if (incident.status !== 'active' && incident.status !== 'escalated') {
      return res.status(400).json({
        error: 'Incident is not active'
      });
    }

    // Update incident
    incident.status = 'acknowledged';
    incident.acknowledgedBy = req.userId;
    incident.acknowledgedAt = new Date();

    // Mark escalation as acknowledged
    const escalation = incident.escalations.find(e => e.user.equals(req.userId));
    if (escalation) {
      escalation.acknowledged = true;
    }

    await incident.save();

    // Update user stats
    const user = await User.findById(req.userId);
    user.acknowledgedIncidents += 1;
    
    // Calculate new average response time
    const totalResponseTime = user.averageResponseTime * (user.acknowledgedIncidents - 1);
    user.averageResponseTime = (totalResponseTime + incident.responseTime) / user.acknowledgedIncidents;
    await user.save();

    // Notify all involved users
    const project = await Project.findById(incident.project).populate('members');
    for (const memberId of project.members) {
      if (!memberId.equals(req.userId)) {
        const notification = new Notification({
          user: memberId,
          type: 'incident_alert',
          title: '✅ Incident Acknowledged',
          message: `${req.user.name} acknowledged the incident: ${incident.alertMessage}`,
          issue: incident.issue,
          incident: incident._id,
          project: incident.project,
          priority: 'high',
          actionUrl: `/incidents/${incident._id}`
        });
        await notification.save();
        req.app.get('io').to(`user_${memberId}`).emit('notification', notification);
      }
    }

    // Emit incident acknowledged event
    req.app.get('io').emit('incident_acknowledged', {
      incident,
      acknowledgedBy: req.user
    });

    res.json({
      message: 'Incident acknowledged successfully',
      incident,
      responseTime: incident.responseTime
    });
  } catch (error) {
    console.error('Acknowledge incident error:', error);
    res.status(500).json({
      error: 'Failed to acknowledge incident'
    });
  }
});

/**
 * GET /api/incidents
 * Get all incidents
 */
router.get('/', async (req, res) => {
  try {
    const { status, projectId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (projectId) filter.project = projectId;

    const incidents = await Incident.find(filter)
      .populate('issue', 'key title')
      .populate('project', 'name key')
      .populate('triggeredBy acknowledgedBy', 'name email')
      .populate('escalations.user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      incidents,
      count: incidents.length
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      error: 'Failed to get incidents'
    });
  }
});

/**
 * GET /api/incidents/:id
 * Get a specific incident
 */
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('issue')
      .populate('project', 'name key')
      .populate('triggeredBy acknowledgedBy', 'name email')
      .populate('escalations.user', 'name email phone isOnCall');

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({
      error: 'Failed to get incident'
    });
  }
});

/**
 * PUT /api/incidents/:id/resolve
 * Resolve an incident
 */
router.put('/:id/resolve', [
  body('resolutionNotes').optional().trim()
], async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.resolutionNotes = req.body.resolutionNotes;

    await incident.save();

    // Update associated issue
    const issue = await Issue.findById(incident.issue);
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      await issue.save();
    }

    // Emit incident resolved event
    req.app.get('io').emit('incident_resolved', incident);

    res.json({
      message: 'Incident resolved successfully',
      incident
    });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({
      error: 'Failed to resolve incident'
    });
  }
});

/**
 * Helper function to schedule escalation
 */
function scheduleEscalation(incidentId, io) {
  const timeoutMinutes = parseInt(process.env.ESCALATION_TIMEOUT_MINUTES) || 5;
  
  setTimeout(async () => {
    try {
      const incident = await Incident.findById(incidentId)
        .populate('project')
        .populate('issue');

      if (!incident || incident.status !== 'active') {
        return; // Incident was acknowledged or resolved
      }

      // Escalate
      incident.escalationLevel += 1;
      incident.status = 'escalated';

      if (incident.escalationLevel >= (parseInt(process.env.MAX_ESCALATION_ATTEMPTS) || 3)) {
        // Max escalation reached - notify all admins
        const admins = await User.find({ role: 'admin' });
        
        for (const admin of admins) {
          const notification = new Notification({
            user: admin._id,
            type: 'escalation',
            title: '🚨 MAX ESCALATION REACHED',
            message: `Incident ${incident.alertMessage} has not been acknowledged after ${incident.escalationLevel} attempts`,
            incident: incident._id,
            priority: 'critical'
          });
          await notification.save();

          if (admin.fcmToken) {
            await sendPushNotification(admin.fcmToken, {
              title: '🚨 MAX ESCALATION',
              body: notification.message,
              data: { type: 'escalation', incidentId: incident._id.toString() }
            });
          }

          io.to(`user_${admin._id}`).emit('escalation_alert', notification);
        }
      } else {
        // Schedule next escalation
        incident.nextEscalationAt = new Date(Date.now() + timeoutMinutes * 60000);
        await incident.save();
        scheduleEscalation(incidentId, io);
      }

      await incident.save();
    } catch (error) {
      console.error('Escalation error:', error);
    }
  }, timeoutMinutes * 60000);
}

module.exports = router;
