const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function resetAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete any existing admin users
        await User.deleteMany({ role: 'admin' });
        console.log('Deleted existing admin users');

        // Create new admin user - let the User model handle password hashing
        const admin = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed by pre-save hook
            name: 'System Administrator',
            role: 'admin',
            status: 'active',
            email: 'admin@certify.com',
            blockchainAddress: '0x0000000000000000000000000000000000000000'
        });

        await admin.save();
        console.log('New admin user created successfully');

        // Verify the password works
        const isMatch = await admin.comparePassword('admin123');
        console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');

        console.log('\nAdmin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

resetAdmin(); 
 