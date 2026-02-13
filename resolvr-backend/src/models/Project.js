/**
 * Project Model
 * Represents projects that contain issues
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Project key is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{2,10}$/, 'Project key must be 2-10 uppercase letters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'on-hold'],
    default: 'active'
  },
  // On-call rotation for incidents
  onCallUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  color: {
    type: String,
    default: '#3498db'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
projectSchema.index({ key: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });

module.exports = mongoose.model('Project', projectSchema);
