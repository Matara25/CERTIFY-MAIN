const mongoose = require('mongoose');
const Institute = require('../models/institute');
require('dotenv').config();

console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/certify');

// Connect to MongoDB with all options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certify', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('MongoDB connected successfully');
  testAddInstitute();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testAddInstitute() {
  try {
    console.log('\nTesting institute creation...');
    
    // Create a test institute
    const testInstitute = new Institute({
      name: 'Test Institute',
      acronym: 'TI',
      website: 'https://testinstitute.com',
      address: '123 Test St, Test City, Test Country',
      courses: ['Computer Science', 'Engineering', 'Business']
    });
    
    console.log('\nTest institute object:', JSON.stringify(testInstitute, null, 2));
    console.log('\nAttempting to save to MongoDB...');
    
    const savedInstitute = await testInstitute.save();
    console.log('\nInstitute saved successfully:', JSON.stringify(savedInstitute, null, 2));
    
    // Verify the institute was added
    console.log('\nVerifying institute was added...');
    const institutes = await Institute.find();
    console.log('\nAll institutes in database:');
    institutes.forEach(institute => {
      console.log(`- ${institute.name} (${institute.acronym})`);
      console.log('  Address:', institute.address);
      console.log('  Website:', institute.website);
      console.log('  Courses:', institute.courses.join(', '));
      console.log('---');
    });
    
    console.log('\nTest completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\nError details:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.errors) {
      console.error('\nValidation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}:`, error.errors[key].message);
      });
    }
    process.exit(1);
  }
} 