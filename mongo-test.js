const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('MongoDB Connection Test');
    console.log('======================\n');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected successfully to MongoDB Atlas!\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Available collections:');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach(col => console.log(`- ${col.name}`));
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testConnection(); 