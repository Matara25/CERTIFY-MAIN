const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  issuedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  blockchainHash: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  revocationReason: String,
  revocationDate: Date,
  revocationBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
certificateSchema.index({ issuedTo: 1 });
certificateSchema.index({ issuedBy: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ blockchainHash: 1 });

// Method to check if certificate is valid
certificateSchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'expired';
    return false;
  }
  return true;
};

// Method to revoke certificate
certificateSchema.methods.revoke = async function(userId, reason) {
  this.status = 'revoked';
  this.revocationReason = reason;
  this.revocationDate = new Date();
  this.revocationBy = userId;
  return this.save();
};

// Static method to get certificate statistics
certificateSchema.statics.getStats = async function(issuerId) {
  try {
    // Convert string ID to ObjectId if needed
    const objectId = typeof issuerId === 'string' ? new mongoose.Types.ObjectId(issuerId) : issuerId;
    
    return this.aggregate([
      { $match: { issuedBy: objectId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        latestIssue: { $max: '$issueDate' }
      }}
    ]);
  } catch (error) {
    console.error('Error in getStats:', error);
    return [];
  }
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate; 