const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function insertAdmin() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Get the User model
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            email: String,
            password: String,
            name: String,
            role: String,
            status: String,
            blockchainAddress: String
        }));

        // Delete any existing admin users
        console.log('\nCleaning up existing admin users...');
        await User.deleteMany({ role: 'admin' });
        console.log('Deleted existing admin users');

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create new admin user
        console.log('\nCreating new admin user...');
        const admin = new User({
            username: 'admin',
            password: hashedPassword,
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
        const isMatch = await bcrypt.compare('admin123', savedAdmin.password);
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

insertAdmin(); 