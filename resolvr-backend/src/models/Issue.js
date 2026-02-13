/**
 * Issue Model
 * Represents tasks, bugs, and features
 */

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'incident'],
    default: 'task'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'blocked'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical', 'blocker'],
    default: 'minor'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Issue key (e.g., PROJ-123)
  key: {
    type: String,
    unique: true,
    required: true
  },
  // Comments/activity
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Watchers
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Time tracking
  estimatedHours: Number,
  loggedHours: Number,
  dueDate: Date,
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Indexes
issueSchema.index({ key: 1 });
issueSchema.index({ project: 1, status: 1 });
issueSchema.index({ assignee: 1 });
issueSchema.index({ priority: 1 });

// Generate issue key before saving
issueSchema.pre('save', async function(next) {
  if (this.isNew && !this.key) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.project);
    
    if (!project) {
      return next(new Error('Project not found'));
    }
    
    // Count existing issues in project
    const count = await mongoose.model('Issue').countDocuments({ project: this.project });
    this.key = `${project.key}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
