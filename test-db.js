require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('- No collections found');
    } else {
      collections.forEach(col => console.log(`- ${col.name}`));
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testConnection(); 