const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certify')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function removeInstitute() {
  try {
    console.log('\nFinding existing institute...');
    
    // Find institute by username
    const institute = await User.findOne({ 
      username: 'institute',
      role: 'issuer'
    });
    
    if (!institute) {
      console.log('No institute user found to remove.');
      process.exit(0);
    }
    
    console.log('\nRemoving institute from MongoDB...');
    await User.findByIdAndDelete(institute._id);
    console.log('Institute removed from MongoDB successfully');
    
    console.log('\nInstitute removal completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\nError removing institute:', error);
    process.exit(1);
  }
}

removeInstitute(); 