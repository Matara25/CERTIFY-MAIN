const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB connection string from environment variable or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/certify?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Log the connection string (with password obscured)
    const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Connection string:', maskedUri);

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('MongoDB Atlas connected successfully');
    
    // Test the connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('MongoDB connection error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  }
};

module.exports = connectDB; 