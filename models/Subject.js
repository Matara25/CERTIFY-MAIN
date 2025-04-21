const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
subjectSchema.index({ status: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 