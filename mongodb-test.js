const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('MongoDB Connection Test');
    console.log('======================');
    console.log(`Node.js version: ${process.version}`);
    console.log(`Mongoose version: ${mongoose.version}`);
    console.log('\nAttempting to connect to MongoDB Atlas...');
    
    // Hide sensitive information in logs
    const sanitizedUri = process.env.MONGODB_URI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://[username]:[password]@'
    );
    console.log(`Connection URI: ${sanitizedUri}`);

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    console.log('\n✅ Successfully connected to MongoDB Atlas!');
    console.log(`Connected to database: ${connection.connection.name}`);

    // Test database operations
    const db = mongoose.connection.db;
    console.log('\nTesting database operations...');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('- No collections found (empty database)');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }

    // Get database stats
    const stats = await db.stats();
    console.log('\nDatabase statistics:');
    console.log(`- Collections: ${stats.collections}`);
    console.log(`- Documents: ${stats.objects}`);
    console.log(`- Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    return true;
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('Error details:');
    console.error('--------------');
    console.error(error);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\nPossible solutions:');
      console.log('1. Check if the connection string is correct');
      console.log('2. Verify network connectivity to MongoDB Atlas');
      console.log('3. Check if your IP address is whitelisted in MongoDB Atlas');
      console.log('4. Verify username and password are correct');
    }
    
    return false;
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\nConnection closed successfully.');
    } catch (error) {
      console.error('\nError while closing connection:', error);
    }
  }
}

// Run the test
console.log('Starting MongoDB Atlas connection test...');
console.log('=====================================\n');

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Connection test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  }); 