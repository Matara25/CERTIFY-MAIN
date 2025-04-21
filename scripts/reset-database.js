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

async function resetDatabase() {
  try {
    // Delete all users
    await User.deleteMany({});
    console.log('All users deleted from database');

    // Create single admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@certify.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      blockchainAddress: '0x0000000000000000000000000000000000000000',
      status: 'active',
      registrationNumber: 'ADMIN001'
    });

    await adminUser.save();
    console.log('New admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 