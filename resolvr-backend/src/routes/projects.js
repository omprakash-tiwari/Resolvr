/**
 * Project Routes
 * Handles project creation, listing, and management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('key').trim().notEmpty().isUppercase().isLength({ min: 2, max: 10 }).withMessage('Project key must be 2-10 uppercase letters'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, key, description, color } = req.body;

    // Check if project key already exists
    const existingProject = await Project.findOne({ key: key.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({
        error: 'Project key already exists'
      });
    }

    // Create project
    const project = new Project({
      name,
      key: key.toUpperCase(),
      description,
      color: color || '#3498db',
      owner: req.userId,
      members: [req.userId]
    });

    await project.save();
    await project.populate('owner members', 'name email role');

    // Emit socket event
    req.app.get('io').emit('project_created', project);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project'
    });
  }
});

/**
 * GET /api/projects
 * Get all projects for the current user
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ],
      status: { $ne: 'archived' }
    })
    .populate('owner members onCallUsers', 'name email role isOnCall')
    .sort({ createdAt: -1 });

    res.json({
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to get projects'
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner members onCallUsers', 'name email role isOnCall');

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Check if user has access
    const hasAccess = project.members.some(member => member._id.equals(req.userId)) || 
                      project.owner._id.equals(req.userId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Failed to get project'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'archived', 'on-hold'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Only owner can update project
    if (!project.owner.equals(req.userId)) {
      return res.status(403).json({
        error: 'Only project owner can update project'
      });
    }

    const { name, description, status, color } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;

    await project.save();
    await project.populate('owner members onCallUsers', 'name email role isOnCall');

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project'
    });
  }
});

/**
 * POST /api/projects/:id/members
 * Add member to project
 */
router.post('/:id/members', [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Only owner can add members
    if (!project.owner.equals(req.userId)) {
      return res.status(403).json({
        error: 'Only project owner can add members'
      });
    }

    const { userId } = req.body;

    // Check if already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({
        error: 'User is already a member'
      });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('owner members onCallUsers', 'name email role isOnCall');

    res.json({
      message: 'Member added successfully',
      project
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      error: 'Failed to add member'
    });
  }
});

/**
 * PUT /api/projects/:id/on-call
 * Update on-call users for project
 */
router.put('/:id/on-call', [
  body('userIds').isArray().withMessage('User IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Only owner or admin can update on-call
    if (!project.owner.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const { userIds } = req.body;
    project.onCallUsers = userIds;
    await project.save();
    await project.populate('owner members onCallUsers', 'name email role isOnCall');

    res.json({
      message: 'On-call users updated successfully',
      project
    });
  } catch (error) {
    console.error('Update on-call error:', error);
    res.status(500).json({
      error: 'Failed to update on-call users'
    });
  }
});

module.exports = router;
