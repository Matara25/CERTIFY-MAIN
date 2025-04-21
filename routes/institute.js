const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const contractConfig = require('../config/contract');
const Institute = require('../models/institute');
const Employer = require('../models/employer');

// Initialize Web3 with Ganache provider
const web3 = new Web3(process.env.GANACHE_URL || 'http://127.0.0.1:7545');

// Initialize contract
const contract = new web3.eth.Contract(
  contractConfig.studentRegistry.abi,
  contractConfig.studentRegistry.address
);

// Middleware to check if user is an institute
const isIssuer = (req, res, next) => {
  if (req.session.isIssuer && req.session.user && req.session.user.role === 'issuer') {
    next();
  } else {
    res.redirect('/institutelogin?message=Please login as institute');
  }
};

// Institute dashboard route
router.get('/dashboard', isIssuer, async (req, res) => {
  try {
    // Get all institutes and employers for the dashboard
    const institutes = await Institute.find().sort({ createdAt: -1 });
    const employers = await Employer.find().sort({ createdAt: -1 });
    
    res.render('institute/dashboard', {
      user: req.session.user,
      institutes,
      employers,
      error: null
    });
  } catch (error) {
    console.error('Error loading institute dashboard:', error);
    res.render('institute/dashboard', { 
      user: req.session.user,
      institutes: [],
      employers: [],
      error: 'Error loading dashboard data'
    });
  }
});

// Routes for managing institutes - no admin check required
router.get('/manage', (req, res) => {
  res.render('admin/manage-institutes', { error: null });
});

router.get('/employers/manage', (req, res) => {
  res.render('admin/manage-employers', { error: null });
});

router.get('/view', async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ createdAt: -1 });
    console.log('Fetched institutes:', institutes);
    res.render('admin/view-institutes', { 
      institutes, 
      error: null,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.render('admin/view-institutes', { 
      institutes: [], 
      error: 'Failed to fetch institutes: ' + error.message
    });
  }
});

router.get('/employers/view', async (req, res) => {
  try {
    const employers = await Employer.find();
    res.render('admin/view-employers', { employers });
  } catch (error) {
    res.render('admin/view-employers', { error: error.message });
  }
});

router.get('/add', (req, res) => {
  res.render('admin/manage-institutes', { error: null });
});

router.post('/add', async (req, res) => {
  try {
    console.log('\nReceived institute data:', req.body);
    const { name, acronym, website, address, courses } = req.body;
    
    // Validate required fields
    if (!name || !acronym || !website || !address || !courses) {
      console.error('Missing required fields');
      return res.render('admin/manage-institutes', { 
        error: 'All fields are required. Please fill in all the fields.',
        formData: req.body
      });
    }

    // Check if institute already exists
    const existingInstitute = await Institute.findOne({ 
      $or: [{ name }, { acronym }] 
    });
    
    if (existingInstitute) {
      return res.render('admin/manage-institutes', { 
        error: 'An institute with this name or acronym already exists.',
        formData: req.body
      });
    }

    // Create and save institute
    const institute = new Institute({
      name,
      acronym,
      website,
      address,
      courses: courses.split(',').map(course => course.trim())
    });
    
    const savedInstitute = await institute.save();
    console.log('\nInstitute saved successfully:', savedInstitute);
    
    // Try to add to blockchain (non-critical)
    try {
      const accounts = await web3.eth.getAccounts();
      if (contract.methods.addInstitute) {
        await contract.methods.addInstitute(name).send({ from: accounts[0] });
        console.log('Institute added to blockchain successfully');
      }
    } catch (blockchainError) {
      console.error('Blockchain error (non-critical):', blockchainError);
    }
    
    res.redirect('/institute/view');
  } catch (error) {
    console.error('\nError adding institute:', error);
    res.render('admin/manage-institutes', { 
      error: 'Failed to add institute: ' + error.message,
      formData: req.body
    });
  }
});

router.post('/employers/add', async (req, res) => {
  try {
    const { name, industry, location, website } = req.body;
    
    // Add to blockchain (if available)
    try {
      const accounts = await web3.eth.getAccounts();
      if (contract.methods.addEmployer) {
        await contract.methods.addEmployer(name).send({ from: accounts[0] });
        console.log('Employer added to blockchain successfully');
      } else {
        console.log('Blockchain method addEmployer not available, skipping blockchain integration');
      }
    } catch (blockchainError) {
      console.error('Blockchain error (non-critical):', blockchainError);
      // Continue with MongoDB operation even if blockchain fails
    }
    
    // Add to MongoDB
    const employer = new Employer({
      name,
      industry,
      location,
      website
    });
    await employer.save();
    console.log('Employer added to MongoDB successfully');
    
    res.redirect('/institute/employers/view');
  } catch (error) {
    console.error('Error adding employer:', error);
    res.render('admin/manage-employers', { error: 'Failed to add employer: ' + error.message });
  }
});

router.post('/remove/:id', async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res.redirect('/institute/view');
    }

    // Remove from blockchain
    const accounts = await web3.eth.getAccounts();
    await contract.methods.removeInstitute(institute.name).send({ from: accounts[0] });
    
    // Remove from MongoDB
    await Institute.findByIdAndDelete(req.params.id);
    
    res.redirect('/institute/view');
  } catch (error) {
    console.error('Error removing institute:', error);
    res.redirect('/institute/view');
  }
});

router.post('/remove-employer/:id', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.redirect('/institute/employers/view');
    }

    // Remove from blockchain
    const accounts = await web3.eth.getAccounts();
    await contract.methods.removeEmployer(employer.name).send({ from: accounts[0] });
    
    // Remove from MongoDB
    await Employer.findByIdAndDelete(req.params.id);
    
    res.redirect('/institute/employers/view');
  } catch (error) {
    console.error('Error removing employer:', error);
    res.redirect('/institute/employers/view');
  }
});

module.exports = router; 