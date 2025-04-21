const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkAdminHash() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found');
            return;
        }

        console.log('\nAdmin user details:');
        console.log('Username:', admin.username);
        console.log('Password hash:', admin.password);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);

        // Test password verification
        const testPassword = 'admin123';
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        console.log('\nPassword verification test:');
        console.log('Test password:', testPassword);
        console.log('Password match:', isMatch);

        // Create a new hash for comparison
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('\nNew hash for same password:', newHash);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkAdminHash(); 