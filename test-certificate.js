require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function testCertificateModel() {
  try {
    console.log('Testing Certificate model...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test getStats method
    console.log('\nTesting getStats method:');
    
    // Test with a valid ObjectId
    const testId = new mongoose.Types.ObjectId();
    console.log('Test ID:', testId.toString());
    
    const stats = await Certificate.getStats(testId);
    console.log('Stats result:', JSON.stringify(stats, null, 2));
    
    // Test with a string ID
    const stringId = testId.toString();
    console.log('\nTesting with string ID:', stringId);
    
    const statsWithString = await Certificate.getStats(stringId);
    console.log('Stats result with string ID:', JSON.stringify(statsWithString, null, 2));
    
    console.log('\n✅ Certificate model test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing Certificate model:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

testCertificateModel(); 