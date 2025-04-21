const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certify', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Admin credentials
const adminUsername = 'admin';
const adminPassword = 'admin123';

async function resetAdminPassword() {
  try {
    // Find admin by username
    const admin = await User.findOne({ username: adminUsername, role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found with username:', adminUsername);
      process.exit(1);
    }
    
    console.log('Found admin user:', {
      username: admin.username,
      email: admin.email,
      name: admin.name
    });
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Update password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password reset successfully');
    console.log('Username:', adminUsername);
    console.log('New Password:', adminPassword);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 