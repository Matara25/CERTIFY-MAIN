const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
async function connectMongoDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB: Connected to Atlas');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Define Subject model
const subjectSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  credits: Number,
  status: String,
  createdBy: mongoose.Schema.Types.ObjectId
});

const Subject = mongoose.model('Subject', subjectSchema);

// Define route to render subjects
app.get('/test-subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ code: 1 });
    res.render('admin/subjects', {
      user: { name: 'Test User' },
      subjects,
      message: null
    });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  await connectMongoDB();
  console.log(`Visit http://localhost:${PORT}/test-subjects to see the subjects page`);
}); 