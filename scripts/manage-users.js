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

async function listUsers() {
  try {
    const users = await User.find({});
    console.log('\nAll Users in Database:');
    console.log('----------------------');
    users.forEach(user => {
      console.log(`\nUser ID: ${user._id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.name}`);
      console.log(`Status: ${user.status}`);
      console.log('----------------------');
    });
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

async function resetUserPassword(username, newPassword) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`No user found with username: ${username}`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    console.log(`\nPassword reset successful for user: ${username}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args[0] === 'list') {
  listUsers();
} else if (args[0] === 'reset' && args[1] && args[2]) {
  resetUserPassword(args[1], args[2]);
} else {
  console.log('\nUsage:');
  console.log('  node manage-users.js list                    - List all users');
  console.log('  node manage-users.js reset <username> <pass> - Reset user password');
} 