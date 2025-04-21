const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function listUsers() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Find all users
        const users = await User.find({});
        
        if (users.length === 0) {
            console.log('\nNo users found in the database!');
            return;
        }

        console.log('\nAll users in database:');
        console.log('====================');
        
        for (const user of users) {
            console.log(`\nUser Details:`);
            console.log('-------------');
            console.log('Username:', user.username);
            console.log('Role:', user.role);
            console.log('Email:', user.email);
            console.log('Name:', user.name);
            console.log('Status:', user.status);
            console.log('Blockchain Address:', user.blockchainAddress);
            console.log('Created At:', user.createdAt);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

listUsers(); 