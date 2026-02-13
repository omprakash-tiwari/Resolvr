/**
 * Issue Routes
 * Handles issue (task, bug, feature) creation and management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/issues
 * Create a new issue
 */
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('type').optional().isIn(['task', 'bug', 'feature', 'incident']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('severity').optional().isIn(['minor', 'major', 'critical', 'blocker'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, projectId, type, priority, severity, assigneeId } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Check if user has access to project
    const hasAccess = project.members.includes(req.userId) || project.owner.equals(req.userId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied to this project'
      });
    }

    // Generate issue key (e.g., MOBILE-1, API-2, etc.)
    const issueCount = await Issue.countDocuments({ project: projectId });
    const issueKey = `${project.key}-${issueCount + 1}`;

    // Create issue
    const issue = new Issue({
      title,
      description,
      key: issueKey,
      project: projectId,
      type: type || 'task',
      priority: priority || 'medium',
      severity: severity || 'minor',
      reporter: req.userId,
      assignee: assigneeId || null,
      watchers: [req.userId]
    });

    await issue.save();
    await issue.populate('project reporter assignee', 'name email key color');

    // Auto-create incident for critical priority or incident type issues
    if (issue.priority === 'critical' || issue.type === 'incident') {
      // Map issue severity to incident severity (only 'critical' or 'blocker' allowed)
      let incidentSeverity = 'critical';
      if (issue.severity === 'blocker') {
        incidentSeverity = 'blocker';
      }

      const incident = new Incident({
        issue: issue._id,
        project: projectId,
        status: 'active',
        severity: incidentSeverity,
        triggeredBy: req.userId,
        description: `Incident auto-created from ${issue.key}: ${issue.title}`,
        alertMessage: `${issue.key}: ${issue.title}`
      });
      await incident.save();

      // Start escalation timer
      scheduleIncidentEscalation(incident._id, req.app.get('io'));

      // Notify all project members about the incident
      if (project.members && project.members.length > 0) {
        const notificationPromises = project.members.map(async (userId) => {
          const notification = new Notification({
            user: userId,
            type: 'incident_alert',
            title: '🚨 Critical Incident Created',
            message: `${issue.key}: ${issue.title}`,
            issue: issue._id,
            incident: incident._id,
            project: projectId,
            priority: 'critical',
            actionUrl: `/incidents/${incident._id}`
          });
          await notification.save();

          // Emit real-time notification
          req.app.get('io').to(`user_${userId}`).emit('incident_created', {
            incident,
            notification
          });
        });

        await Promise.all(notificationPromises);
        
        console.log(`✅ Incident ${incident._id} created and ${project.members.length} project members notified`);
      } else {
        console.log(`⚠️ Incident ${incident._id} created but no project members to notify`);
      }
    }

    // Create notification for assignee
    if (assigneeId && assigneeId !== req.userId.toString()) {
      const notification = new Notification({
        user: assigneeId,
        type: 'issue_assigned',
        title: 'New Issue Assigned',
        message: `${req.user.name} assigned you to ${issue.key}: ${issue.title}`,
        issue: issue._id,
        project: projectId,
        priority: issue.priority,
        actionUrl: `/issues/${issue._id}`
      });
      await notification.save();

      // Emit real-time notification
      req.app.get('io').to(`user_${assigneeId}`).emit('notification', notification);
    }

    // Emit issue created event
    req.app.get('io').emit('issue_created', issue);

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      error: 'Failed to create issue'
    });
  }
});

/**
 * GET /api/issues
 * Get all issues (with filters)
 */
router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority, assignee, type } = req.query;

    // Build filter
    const filter = {};
    
    if (projectId) {
      filter.project = projectId;
    } else {
      // Get all projects user has access to
      const projects = await Project.find({
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      }).select('_id');
      filter.project = { $in: projects.map(p => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (type) filter.type = type;

    const issues = await Issue.find(filter)
      .populate('project', 'name key color')
      .populate('reporter assignee', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      issues,
      count: issues.length
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      error: 'Failed to get issues'
    });
  }
});

/**
 * GET /api/issues/:id
 * Get a specific issue
 */
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('project', 'name key color')
      .populate('reporter assignee watchers', 'name email role')
      .populate('comments.user', 'name email');

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    res.json({ issue });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      error: 'Failed to get issue'
    });
  }
});

/**
 * PUT /api/issues/:id
 * Update an issue
 */
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'blocked']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('severity').optional().isIn(['minor', 'major', 'critical', 'blocker'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const { title, description, status, priority, severity, assigneeId } = req.body;

    // Track changes for notifications
    const changes = [];

    if (title && title !== issue.title) {
      changes.push(`title changed to "${title}"`);
      issue.title = title;
    }
    if (description !== undefined) issue.description = description;
    if (status && status !== issue.status) {
      changes.push(`status changed to ${status}`);
      issue.status = status;
      if (status === 'resolved') {
        issue.resolvedAt = new Date();
      } else if (status === 'closed') {
        issue.closedAt = new Date();
      }
    }
    if (priority && priority !== issue.priority) {
      changes.push(`priority changed to ${priority}`);
      issue.priority = priority;
    }
    if (severity && severity !== issue.severity) {
      changes.push(`severity changed to ${severity}`);
      issue.severity = severity;
    }
    if (assigneeId !== undefined && assigneeId !== issue.assignee?.toString()) {
      changes.push('assignee changed');
      issue.assignee = assigneeId || null;

      // Notify new assignee
      if (assigneeId && assigneeId !== req.userId.toString()) {
        const notification = new Notification({
          user: assigneeId,
          type: 'issue_assigned',
          title: 'Issue Assigned to You',
          message: `${req.user.name} assigned you to ${issue.key}: ${issue.title}`,
          issue: issue._id,
          project: issue.project,
          priority: issue.priority,
          actionUrl: `/issues/${issue._id}`
        });
        await notification.save();
        req.app.get('io').to(`user_${assigneeId}`).emit('notification', notification);
      }
    }

    await issue.save();
    await issue.populate('project reporter assignee', 'name email role key color');

    // Notify watchers of changes
    if (changes.length > 0) {
      for (const watcherId of issue.watchers) {
        if (!watcherId.equals(req.userId)) {
          const notification = new Notification({
            user: watcherId,
            type: 'issue_updated',
            title: `${issue.key} Updated`,
            message: `${req.user.name} updated ${issue.key}: ${changes.join(', ')}`,
            issue: issue._id,
            project: issue.project,
            actionUrl: `/issues/${issue._id}`
          });
          await notification.save();
          req.app.get('io').to(`user_${watcherId}`).emit('notification', notification);
        }
      }
    }

    // Emit issue updated event
    req.app.get('io').emit('issue_updated', issue);

    res.json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      error: 'Failed to update issue'
    });
  }
});

/**
 * POST /api/issues/:id/comments
 * Add a comment to an issue
 */
router.post('/:id/comments', [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const { text } = req.body;

    issue.comments.push({
      user: req.userId,
      text,
      createdAt: new Date()
    });

    await issue.save();
    await issue.populate('comments.user', 'name email');

    // Notify watchers
    for (const watcherId of issue.watchers) {
      if (!watcherId.equals(req.userId)) {
        const notification = new Notification({
          user: watcherId,
          type: 'comment_added',
          title: `New Comment on ${issue.key}`,
          message: `${req.user.name} commented: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
          issue: issue._id,
          project: issue.project,
          actionUrl: `/issues/${issue._id}`
        });
        await notification.save();
        req.app.get('io').to(`user_${watcherId}`).emit('notification', notification);
      }
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: issue.comments[issue.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      error: 'Failed to add comment'
    });
  }
});

/**
 * GET /api/issues/kanban/:projectId
 * Get issues organized in Kanban board format
 */
router.get('/kanban/:projectId', async (req, res) => {
  try {
    const issues = await Issue.find({ project: req.params.projectId })
      .populate('reporter assignee', 'name email')
      .sort({ createdAt: -1 });

    // Organize by status
    const kanban = {
      open: issues.filter(i => i.status === 'open'),
      'in-progress': issues.filter(i => i.status === 'in-progress'),
      resolved: issues.filter(i => i.status === 'resolved'),
      closed: issues.filter(i => i.status === 'closed'),
      blocked: issues.filter(i => i.status === 'blocked')
    };

    res.json({ kanban });
  } catch (error) {
    console.error('Get kanban error:', error);
    res.status(500).json({
      error: 'Failed to get kanban board'
    });
  }
});

/**
 * Helper function to schedule incident escalation
 */
function scheduleIncidentEscalation(incidentId, io) {
  const timeoutMinutes = parseInt(process.env.ESCALATION_TIMEOUT_MINUTES) || 5;
  
  console.log(`Scheduling escalation for incident ${incidentId} in ${timeoutMinutes} minutes`);
  
  setTimeout(async () => {
    try {
      const incident = await Incident.findById(incidentId)
        .populate('project')
        .populate('issue');

      if (!incident || incident.status !== 'active') {
        console.log(`Incident ${incidentId} was acknowledged or resolved - skipping escalation`);
        return;
      }

      console.log(`Escalating incident ${incidentId} to level ${incident.escalationLevel + 1}`);

      // Escalate
      incident.escalationLevel += 1;
      incident.status = 'escalated';

      const User = require('../models/User');
      const Notification = require('../models/Notification');

      if (incident.escalationLevel >= (parseInt(process.env.MAX_ESCALATION_ATTEMPTS) || 3)) {
        // Max escalation reached - notify all admins
        const admins = await User.find({ role: 'admin' });
        
        console.log(`Max escalation reached for ${incidentId}, notifying ${admins.length} admins`);
        
        for (const admin of admins) {
          const notification = new Notification({
            user: admin._id,
            type: 'escalation',
            title: '🚨 MAX ESCALATION REACHED',
            message: `Incident ${incident.alertMessage || incident.description} has not been acknowledged after ${incident.escalationLevel} attempts`,
            incident: incident._id,
            priority: 'critical'
          });
          await notification.save();

          io.to(`user_${admin._id}`).emit('escalation_alert', notification);
        }
      } else {
        // Schedule next escalation
        incident.nextEscalationAt = new Date(Date.now() + timeoutMinutes * 60000);
        scheduleIncidentEscalation(incidentId, io);
      }

      await incident.save();
      
      // Emit update to all connected clients
      io.emit('incident_updated', incident);
    } catch (error) {
      console.error('Escalation error:', error);
    }
  }, timeoutMinutes * 60000);
}

module.exports = router;
