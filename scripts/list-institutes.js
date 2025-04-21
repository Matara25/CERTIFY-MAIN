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

async function listInstitutes() {
  try {
    console.log('\nQuerying for users with role "issuer"...');
    
    const institutes = await User.find({ role: 'issuer' });
    
    if (institutes.length === 0) {
      console.log('No institute users found in the database.');
      process.exit(0);
    }
    
    console.log('\nInstitute Users in Database:');
    console.log('----------------------');
    
    institutes.forEach(institute => {
      console.log(`ID: ${institute._id}`);
      console.log(`Username: ${institute.username}`);
      console.log(`Email: ${institute.email}`);
      console.log(`Name: ${institute.name}`);
      console.log(`Status: ${institute.status}`);
      console.log(`Registration Number: ${institute.registrationNumber}`);
      console.log('----------------------');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing institute users:', error);
    process.exit(1);
  }
}

listInstitutes(); 