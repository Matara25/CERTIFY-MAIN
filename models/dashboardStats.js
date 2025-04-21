const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
    totalStudents: {
        type: Number,
        default: 0
    },
    activeStudents: {
        type: Number,
        default: 0
    },
    totalCertificates: {
        type: Number,
        default: 0
    },
    pendingCertificates: {
        type: Number,
        default: 0
    },
    studentStats: {
        totalStudents: Number,
        activeStudents: Number,
        recentStudents: [{
            name: String,
            email: String,
            createdAt: Date
        }]
    },
    certificateStats: {
        totalIssued: Number,
        pending: Number,
        recentIssued: [{
            studentName: String,
            unitCode: String,
            issueDate: Date
        }]
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on every save
dashboardStatsSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('DashboardStats', dashboardStatsSchema); 