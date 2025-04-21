require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const subjects = [
  {
    code: 'CS101',
    name: 'Introduction to Computer Science',
    credits: 3,
    description: 'Fundamentals of computer science and programming concepts'
  },
  {
    code: 'CS102',
    name: 'Data Structures and Algorithms',
    credits: 4,
    description: 'Study of fundamental data structures and algorithms'
  },
  {
    code: 'CS201',
    name: 'Database Systems',
    credits: 3,
    description: 'Introduction to database design and management'
  },
  {
    code: 'CS202',
    name: 'Web Development',
    credits: 3,
    description: 'Modern web development technologies and practices'
  },
  {
    code: 'CS301',
    name: 'Software Engineering',
    credits: 4,
    description: 'Software development methodologies and practices'
  },
  {
    code: 'CS302',
    name: 'Artificial Intelligence',
    credits: 4,
    description: 'Introduction to AI concepts and machine learning'
  },
  {
    code: 'CS401',
    name: 'Blockchain Technology',
    credits: 3,
    description: 'Fundamentals of blockchain and cryptocurrency'
  }
];

async function initializeSubjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing subjects
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');

    // Create admin user ID for the subjects
    const adminId = new mongoose.Types.ObjectId();

    // Add new subjects
    const subjectsWithAdmin = subjects.map(subject => ({
      ...subject,
      createdBy: adminId
    }));

    await Subject.insertMany(subjectsWithAdmin);
    console.log('Added subjects successfully');

    // Display added subjects
    const addedSubjects = await Subject.find().sort({ code: 1 });
    console.log('\nAdded Subjects:');
    addedSubjects.forEach(subject => {
      console.log(`- ${subject.code}: ${subject.name} (${subject.credits} credits)`);
    });

  } catch (error) {
    console.error('Error initializing subjects:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

initializeSubjects(); 