const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certify';

async function createInstitute() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully\n');

        console.log('Cleaning up existing institute users...');
        await User.deleteMany({ role: 'issuer' });
        console.log('Deleted existing institute users\n');

        // Generate a unique blockchain address
        const blockchainAddress = '0x' + crypto.randomBytes(20).toString('hex');

        console.log('Creating new institute user...');
        const institute = new User({
            username: 'institute',
            password: 'institute123', // Let the pre-save hook handle hashing
            role: 'issuer',
            blockchainAddress: blockchainAddress,
            name: 'Default Institute',
            email: 'institute@certify.com',
            status: 'active'
        });

        await institute.save();
        console.log('Institute user created successfully\n');

        // Verify the user was created
        const savedInstitute = await User.findOne({ role: 'issuer' });
        console.log('Verifying institute user:');
        console.log('Username:', savedInstitute.username);
        console.log('Role:', savedInstitute.role);
        console.log('Status:', savedInstitute.status);
        console.log('Blockchain Address:', savedInstitute.blockchainAddress);
        
        // Test password verification
        const isPasswordValid = await savedInstitute.comparePassword('institute123');
        console.log('Password verification:', isPasswordValid);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

createInstitute(); 