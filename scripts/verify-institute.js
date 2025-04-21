const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/certify?retryWrites=true&w=majority&appName=Cluster0';

async function verifyInstitute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Atlas');

    // Find institute user
    const institute = await User.findOne({ 
      username: 'institute',
      email: 'institute@certify.com',
      role: 'issuer'
    });

    if (!institute) {
      console.log('No institute user found with these credentials');
      return;
    }

    console.log('\nInstitute user found:');
    console.log('Username:', institute.username);
    console.log('Email:', institute.email);
    console.log('Role:', institute.role);
    console.log('Status:', institute.status);
    console.log('Blockchain Address:', institute.blockchainAddress);

    // Verify password
    const isMatch = await institute.comparePassword('institute123');
    console.log('\nPassword verification:', isMatch ? 'PASSED' : 'FAILED');

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyInstitute(); 