const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function createSimpleAdmin() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Delete any existing admin users
        console.log('\nCleaning up existing admin users...');
        await User.deleteMany({ role: 'admin' });
        console.log('Deleted existing admin users');

        // Create new admin user
        console.log('\nCreating new admin user...');
        const admin = new User({
            username: 'admin',
            password: 'admin123',
            name: 'System Administrator',
            role: 'admin',
            status: 'active',
            email: 'admin@certify.com',
            blockchainAddress: '0x0000000000000000000000000000000000000000'
        });

        // Save the admin user
        await admin.save();
        console.log('New admin user created successfully');

        // Verify the admin exists
        const savedAdmin = await User.findOne({ role: 'admin' });
        console.log('\nAdmin user details:');
        console.log('Username:', savedAdmin.username);
        console.log('Role:', savedAdmin.role);
        console.log('Status:', savedAdmin.status);
        console.log('Email:', savedAdmin.email);
        console.log('Blockchain Address:', savedAdmin.blockchainAddress);

        // Test password
        const isMatch = await savedAdmin.comparePassword('admin123');
        console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('Error:', error);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

createSimpleAdmin(); 