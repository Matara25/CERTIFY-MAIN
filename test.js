const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting MongoDB connection test...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Successfully connected to MongoDB!');
  return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log('\nAvailable collections:');
  collections.forEach(collection => {
    console.log(`- ${collection.name}`);
  });
})
.catch(err => {
  console.error('Connection error:', err);
})
.finally(() => {
  mongoose.connection.close();
  console.log('Connection closed.');
}); 