const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'student',
        enum: ['student']
    },
    blockchainAddress: {
        type: String,
        required: true,
        unique: true
    },
    units: [{
        type: String,
        ref: 'Unit'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const bcrypt = require('bcryptjs');
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if model exists before compiling
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = Student; 