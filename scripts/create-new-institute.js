const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/certify?retryWrites=true&w=majority&appName=Cluster0';

async function createNewInstitute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Atlas');

    // First, remove any existing institute users
    await User.deleteMany({ role: 'issuer' });
    console.log('Removed existing institute users');

    // Generate a unique blockchain address
    const blockchainAddress = '0x' + crypto.randomBytes(20).toString('hex');

    // Create new institute user
    const username = 'institute';
    const hashedPassword = await bcrypt.hash('institute123', 10);
    const instituteUser = new User({
      username: username,
      email: `${username}@certify.com`, // Automatically generate email
      password: hashedPassword,
      name: 'Test Institute',
      role: 'issuer',
      status: 'active',
      registrationNumber: 'INST001',
      blockchainAddress: blockchainAddress
    });

    // Save institute to database
    await instituteUser.save();
    console.log('New institute user created successfully');
    console.log('Username: institute');
    console.log('Password: institute123');
    console.log('Email: institute@certify.com (auto-generated)');
    console.log('Blockchain Address:', blockchainAddress);

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating institute:', error);
    process.exit(1);
  }
}

// Run the function
createNewInstitute(); 