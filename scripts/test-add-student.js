const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testAddStudent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB');

        // Create test student data
        const studentData = {
            name: 'Test Student',
            email: 'test.student@example.com',
            password: 'student123',
            registrationNumber: 'STU2025001',
            role: 'student',
            status: 'active',
            subjects: ['Network Security', 'Cloud Computing'],
            blockchainAddress: '0x' + '1'.repeat(40), // Dummy blockchain address
            createdAt: new Date()
        };

        // Create and save the student
        const newStudent = new User(studentData);
        await newStudent.save();
        console.log('Test student created successfully:', newStudent);

        // Verify the student was added
        const student = await User.findOne({ email: studentData.email });
        console.log('\nVerification - Found student in database:', student ? 'Yes' : 'No');
        if (student) {
            console.log('Student details:');
            console.log('- Name:', student.name);
            console.log('- Registration Number:', student.registrationNumber);
            console.log('- Email:', student.email);
            console.log('- Subjects:', student.subjects);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testAddStudent();