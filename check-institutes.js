const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkInstitutes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully\n');

        const users = await User.find({ role: 'issuer' });
        console.log('Found institute users:', users.length);
        
        users.forEach(user => {
            console.log('\nUser details:');
            console.log('- Email:', user.email);
            console.log('- Username:', user.username);
            console.log('- Status:', user.status);
            console.log('- Role:', user.role);
            console.log('- Created:', user.createdAt);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

checkInstitutes(); 