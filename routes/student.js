const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Web3 = require('web3');
const contractConfig = require('../config/contract');
const Student = require('../models/student');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Function to generate a valid Ethereum address
function generateEthereumAddress() {
  // Generate a random private key
  const privateKey = crypto.randomBytes(32);
  // Create a Web3 account from the private key
  const web3 = new Web3();
  const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey.toString('hex'));
  return account.address;
}

// Function to get blockchain address (either from Ganache or generate one)
async function getBlockchainAddress() {
  const web3Provider = process.env.WEB3_PROVIDER || 'http://127.0.0.1:8545';
  const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));
  
  try {
    // Try to get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    const availableAccounts = accounts.slice(2); // Skip admin and institute accounts
    
    // Find unused account
    const usedAddresses = await User.distinct('blockchainAddress');
    const unusedAccount = availableAccounts.find(account => 
      !usedAddresses.includes(account.toLowerCase())
    );
    
    if (unusedAccount) {
      return unusedAccount.toLowerCase();
    }
  } catch (error) {
    console.log('Ganache not available, generating new address');
  }
  
  // If Ganache is not available or no unused accounts, generate a new address
  let newAddress;
  let isUnique = false;
  
  while (!isUnique) {
    newAddress = generateEthereumAddress();
    // Check if address is already in use
    const existingUser = await User.findOne({ blockchainAddress: newAddress.toLowerCase() });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return newAddress.toLowerCase();
}

// Middleware to check if user is logged in and is a student
const isStudent = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.redirect('/student/login');
  }
  next();
};

// Show registration page
router.get('/register', (req, res) => {
  res.render('student/register', { message: null });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, registrationNumber } = req.body;

    // Check if email already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.render('student/register', { 
        message: 'Email already registered. Please login instead.' 
      });
    }

    // Get blockchain address
    const blockchainAddress = await getBlockchainAddress();

    // Create new student
    const student = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      registrationNumber,
      role: 'student',
      status: 'active',
      blockchainAddress
    });

    // Save student
    await student.save();

    // Set session data
    req.session.user = {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
      blockchainAddress: student.blockchainAddress
    };

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('student/register', { 
          message: 'Registration successful but error creating session. Please login.' 
        });
      }
      res.redirect('/student/dashboard');
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.render('student/register', { 
      message: 'Error during registration. Please try again.' 
    });
  }
});

// Show login page
router.get('/login', (req, res) => {
  res.render('student/login', { message: null });
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find student by email
    const student = await User.findOne({ email, role: 'student' });
    
    if (!student) {
      return res.render('student/login', { 
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.render('student/login', { 
        message: 'Invalid email or password' 
      });
    }

    // If student doesn't have a blockchain address, generate one
    if (!student.blockchainAddress) {
      try {
        // Get blockchain address
        const blockchainAddress = await getBlockchainAddress();
        student.blockchainAddress = blockchainAddress;
        await student.save();
      } catch (error) {
        console.error('Error assigning blockchain address:', error);
        return res.render('student/login', { 
          message: 'Error assigning blockchain address. Please contact support.' 
        });
      }
    }

    // Set session data
    req.session.user = {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
      blockchainAddress: student.blockchainAddress
    };

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('student/login', { 
          message: 'Error creating session. Please try again.' 
        });
      }
      res.redirect('/student/dashboard');
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.render('student/login', { 
      message: 'An error occurred. Please try again.' 
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/');
  });
});

// Student dashboard
router.get('/dashboard', isStudent, async (req, res) => {
  try {
    const student = await User.findById(req.session.user._id);
    const certificates = await Certificate.find({ issuedTo: student._id })
      .populate('issuedBy', 'name blockchainAddress')
      .sort({ issueDate: -1 });
    
    res.render('student/dashboard', {
      user: student,
      certificates: certificates,
      error: null
    });
  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.status(500).render('error', { message: 'Error loading dashboard' });
  }
});

// View certificate
router.get('/certificate/:id', isStudent, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('issuedBy', 'name blockchainAddress')
      .populate('issuedTo', 'name blockchainAddress');
    
    if (!certificate) {
      return res.status(404).render('error', { message: 'Certificate not found' });
    }
    
    // Verify certificate belongs to student
    if (certificate.issuedTo._id.toString() !== req.session.userId) {
      return res.status(403).render('error', { message: 'Unauthorized access' });
    }
    
    res.render('viewcertificate', { certificate });
  } catch (error) {
    console.error('Error viewing certificate:', error);
    res.status(500).render('error', { message: 'Error viewing certificate' });
  }
});

// Student Home Page
router.get('/home', isStudent, async (req, res) => {
  try {
    // Get student data
    const student = await User.findById(req.session.user._id)
      .select('name email blockchainAddress subjects completedUnits');
    
    // Get student's certificates
    const certificates = await Certificate.find({ issuedTo: student._id })
      .sort({ issueDate: -1 })
      .limit(5);

    // Calculate statistics
    const stats = {
      totalUnits: student.subjects ? student.subjects.length : 0,
      completedUnits: student.completedUnits ? student.completedUnits.length : 0,
      certificates: certificates.length,
      pendingCertificates: await Certificate.countDocuments({ 
        issuedTo: student._id, 
        status: 'pending' 
      })
    };

    // Get units with completion status
    const units = student.subjects ? student.subjects.map(subject => ({
      code: subject,
      name: subject,
      completed: student.completedUnits && student.completedUnits.includes(subject)
    })) : [];

    res.render('student/home', {
      user: student,
      stats: stats,
      units: units,
      certificates: certificates
    });
  } catch (error) {
    console.error('Error loading student home:', error);
    res.render('student/home', {
      user: req.session.user,
      stats: {},
      units: [],
      certificates: [],
      error: 'Error loading dashboard'
    });
  }
});

module.exports = router;