const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  // Check if MONGODB_URI is set
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env file');
    console.log('Please add MONGODB_URI=your_connection_string to your .env file');
    process.exit(1);
  }

  try {
    console.log('MongoDB Connection Test');
    console.log('======================');
    console.log(`Node.js version: ${process.version}`);
    console.log(`Mongoose version: ${mongoose.version}`);
    console.log('\nAttempting to connect to MongoDB...');
    
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

    console.log('\n✅ Successfully connected to MongoDB!');
    console.log(`Connected to database: ${connection.connection.name}`);

    // Basic database operations test
    try {
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

    } catch (dbError) {
      console.error('\n⚠️ Error while testing database operations:');
      console.error(dbError);
    }

  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('Error details:');
    console.error('--------------');
    console.error(error);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\nPossible solutions:');
      console.log('1. Make sure MongoDB is running on your machine');
      console.log('2. Check if the connection string is correct');
      console.log('3. Verify network connectivity to the database server');
      console.log('4. Check if the database server is accepting connections');
    }
    
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\nConnection closed successfully.');
    } catch (error) {
      console.error('\nError while closing connection:', error);
    }
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Run the test
testConnection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 