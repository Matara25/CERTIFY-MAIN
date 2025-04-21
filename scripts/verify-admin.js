const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function verifyAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certify');
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@certify.com' });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log(`- Name: ${adminUser.name}`);
      console.log(`- Email: ${adminUser.email}`);
      console.log(`- Role: ${adminUser.role}`);
      console.log(`- Status: ${adminUser.status}`);
      console.log(`- Created at: ${adminUser.createdAt}`);
    } else {
      console.log('Admin user not found in the database');
    }

  } catch (error) {
    console.error('Error verifying admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

verifyAdminUser(); 