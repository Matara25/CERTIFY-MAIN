const mongoose = require('mongoose');
const Web3 = require('web3');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const GANACHE_URL = 'http://127.0.0.1:8545';

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Connect to Ganache
        const web3 = new Web3(GANACHE_URL);
        console.log('Connected to Ganache');

        // Get the first account from Ganache
        const accounts = await web3.eth.getAccounts();
        const adminAddress = accounts[0];
        console.log('Using blockchain address:', adminAddress);

        // Delete any existing admin users
        await User.deleteMany({ role: 'admin' });
        console.log('Deleted existing admin users');

        // Create new admin user
        const admin = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed by pre-save hook
            name: 'System Administrator',
            role: 'admin',
            status: 'active',
            email: 'admin@certify.com',
            blockchainAddress: adminAddress
        });

        await admin.save();
        console.log('New admin user created successfully');

        // Verify the password works
        const isMatch = await admin.comparePassword('admin123');
        console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');

        console.log('\nAdmin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Blockchain address:', adminAddress);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createAdmin(); 