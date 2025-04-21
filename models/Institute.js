const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  acronym: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: true
  },
  courses: [{
    type: String
  }],
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Institute', instituteSchema); 