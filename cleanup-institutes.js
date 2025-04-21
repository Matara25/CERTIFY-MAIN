const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function cleanupAndCreateInstitute() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully\n');

        // Delete all existing institute users
        console.log('Cleaning up existing institute users...');
        await User.deleteMany({ role: 'issuer' });
        console.log('Deleted existing institute users\n');

        // Create a new institute user
        console.log('Creating new institute user...');
        const blockchainAddress = '0x' + crypto.randomBytes(20).toString('hex');
        
        const institute = new User({
            username: 'institute',
            email: 'institute@certify.com',
            password: 'institute123', // Let the pre-save hook handle hashing
            name: 'Default Institute',
            role: 'issuer',
            status: 'active',
            blockchainAddress: blockchainAddress
        });

        await institute.save();
        console.log('Institute user created successfully\n');

        // Verify the user was created
        const savedInstitute = await User.findOne({ role: 'issuer' });
        console.log('Verifying institute user:');
        console.log('- Email:', savedInstitute.email);
        console.log('- Role:', savedInstitute.role);
        console.log('- Status:', savedInstitute.status);
        console.log('- Blockchain Address:', savedInstitute.blockchainAddress);
        console.log('Password verification:', await savedInstitute.comparePassword('institute123'));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

cleanupAndCreateInstitute(); 