const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certify', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function printAdminUser() {
  try {
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found in the database.');
      process.exit(0);
    }
    
    console.log('\nAdmin User Details:');
    console.log('===================');
    console.log('Username:', admin.username || 'Not set');
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('Status:', admin.status);
    console.log('Registration Number:', admin.registrationNumber || 'Not set');
    console.log('Blockchain Address:', admin.blockchainAddress || 'Not set');
    console.log('Created At:', admin.createdAt);
    console.log('Last Login:', admin.lastLogin || 'Never');
    
    // Print all fields for debugging
    console.log('\nAll Fields:');
    console.log('===========');
    console.log(JSON.stringify(admin, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error printing admin user:', error);
    process.exit(1);
  }
}

printAdminUser(); 