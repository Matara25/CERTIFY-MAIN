const mongoose = require('mongoose');
const Web3 = require('web3');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const GANACHE_URL = process.env.WEB3_PROVIDER || 'http://127.0.0.1:8545';

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

async function createAdminWithGanache() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Connect to Ganache
        console.log('\nConnecting to Ganache...');
        const web3 = new Web3(GANACHE_URL);
        const accounts = await web3.eth.getAccounts();
        const adminAddress = accounts[0];
        console.log('Using Ganache account:', adminAddress);

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
            blockchainAddress: adminAddress
        });

        // Validate the user before saving
        const validationError = admin.validateSync();
        if (validationError) {
            console.error('Validation errors:', validationError.errors);
            throw validationError;
        }

        await admin.save();
        console.log('New admin user created successfully');

        // Verify the admin was saved
        const savedAdmin = await User.findOne({ role: 'admin' });
        console.log('\nAdmin user details:');
        console.log('Username:', savedAdmin.username);
        console.log('Role:', savedAdmin.role);
        console.log('Status:', savedAdmin.status);
        console.log('Email:', savedAdmin.email);
        console.log('Blockchain Address:', savedAdmin.blockchainAddress);

        // Test password
        const isMatch = await savedAdmin.comparePassword('admin123');
        console.log('Password test:', isMatch ? 'PASSED' : 'FAILED');

        // List all users for verification
        console.log('\nAll users in database:');
        const allUsers = await User.find({});
        allUsers.forEach(user => {
            console.log(`- ${user.username} (${user.role})`);
        });

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

createAdminWithGanache(); 