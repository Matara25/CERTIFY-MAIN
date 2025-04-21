const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found in database');
            return;
        }

        console.log('\nAdmin user found:');
        console.log('Username:', admin.username);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);
        console.log('Blockchain Address:', admin.blockchainAddress);
        console.log('Email:', admin.email);

        // List all users for debugging
        const allUsers = await User.find({});
        console.log('\nAll users in database:');
        allUsers.forEach(user => {
            console.log(`- ${user.username} (${user.role})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkAdmin(); 