const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: function() {
      return this.role !== 'student';
    }
  },
  registrationNumber: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    index: true
  },
  role: {
    type: String,
    enum: ['student', 'issuer', 'admin'],
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  blockchainAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  subjects: {
    type: [String],
    default: []
  },
  completedUnits: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can issue certificates
userSchema.methods.canIssueCertificates = function() {
  return this.role === 'issuer' && this.status === 'active';
};

// Method to check if user can verify certificates
userSchema.methods.canVerifyCertificates = function() {
  return ['issuer', 'admin'].includes(this.role) && this.status === 'active';
};

const User = mongoose.model('User', userSchema);

module.exports = User; 