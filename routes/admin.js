const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const contractConfig = require('../config/contract');
const bcrypt = require('bcryptjs');
const Student = require('../models/student');
const DashboardStats = require('../models/dashboardStats');
require('dotenv').config();

// Initialize Web3 with provider from environment variables
const web3Provider = process.env.WEB3_PROVIDER || 'http://127.0.0.1:7545';
console.log('Using Web3 provider:', web3Provider);

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));

// Verify Web3 connection
web3.eth.net.isListening()
  .then(() => console.log('Web3 is connected to provider:', web3Provider))
  .catch(err => console.error('Web3 connection error:', err));

// Admin credentials (using first Ganache account)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // This is just for the login page, actual authentication uses Ganache account
  address: null // Will be set when getting accounts
};

// In-memory storage for admin data
const adminData = {
  students: [],
  subjects: [],
  certificates: [],
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  }
};

// Get the first Ganache account
async function initializeAdminAccount() {
  try {
    const accounts = await web3.eth.getAccounts();
    ADMIN_CREDENTIALS.address = accounts[0];
    console.log('Admin account initialized:', ADMIN_CREDENTIALS.address);
  } catch (error) {
    console.error('Error initializing admin account:', error);
  }
}

// Initialize admin account on startup
initializeAdminAccount();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin && req.session.adminAddress === ADMIN_CREDENTIALS.address) {
    next();
  } else {
    res.redirect('/admin/login?message=Please login as admin');
  }
};

// Admin Dashboard Route
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
        // Get contract information
        const contractConfig = require('../config/contract');
        if (!contractConfig || !contractConfig.certificate || !contractConfig.certificate.address) {
            return res.render('admin/dashboard', {
                user: req.session.user,
                error: 'Contract configuration not found',
                stats: null,
                recentUsers: [],
                recentLogins: [],
                units: []
            });
        }

        // Initialize contract
        const contract = new web3.eth.Contract(contractConfig.certificate.abi, contractConfig.certificate.address);

        // Get admin account balance
        const adminBalance = await web3.eth.getBalance(ADMIN_CREDENTIALS.address);
        const balanceInEther = web3.utils.fromWei(adminBalance, 'ether');

        // Get available Ganache accounts
        const accounts = await web3.eth.getAccounts();
        const adminAddress = accounts[0];
        const usedAddresses = await Student.find({}, 'blockchainAddress');
        const usedAddressSet = new Set(usedAddresses.map(s => s.blockchainAddress.toLowerCase()));
        const availableAddresses = accounts.filter(addr => 
            addr.toLowerCase() !== adminAddress.toLowerCase() && 
            !usedAddressSet.has(addr.toLowerCase())
        );

        // Get dashboard statistics
        const stats = await DashboardStats.findOne() || new DashboardStats();
        
        // Get recent users and logins
        const recentUsers = await Student.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email createdAt status');

        const recentLogins = await Student.find({ lastLogin: { $exists: true } })
            .sort({ lastLogin: -1 })
            .limit(5)
            .select('name email lastLogin');

        // Define IT units
        const units = [
            { id: 'IT101', code: 'IT101', name: 'Introduction to Information Technology', credits: 3 },
            { id: 'IT102', code: 'IT102', name: 'Computer Programming Fundamentals', credits: 4 },
            { id: 'IT103', code: 'IT103', name: 'Database Management Systems', credits: 4 },
            { id: 'IT104', code: 'IT104', name: 'Web Development', credits: 4 },
            { id: 'IT105', code: 'IT105', name: 'Network Fundamentals', credits: 3 },
            { id: 'IT106', code: 'IT106', name: 'System Analysis and Design', credits: 3 },
            { id: 'IT107', code: 'IT107', name: 'Cybersecurity Basics', credits: 3 },
            { id: 'IT108', code: 'IT108', name: 'Cloud Computing', credits: 3 }
        ];

        res.render('admin/dashboard', {
            user: req.session.user,
            contractAddress: contractConfig.certificate.address,
            adminBalance: balanceInEther,
            availableAddresses: availableAddresses,
            stats: stats,
            recentUsers: recentUsers,
            recentLogins: recentLogins,
            units: units,
            error: null
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.render('admin/dashboard', {
            user: req.session.user,
            error: 'Error loading dashboard',
            stats: null,
            recentUsers: [],
            recentLogins: [],
            units: []
        });
    }
});

// Student Management Routes
router.get('/manage-students', isAdmin, (req, res) => {
  res.render('admin/manage-students', {
    students: adminData.students,
    subjects: adminData.subjects
  });
});

// Add new student
router.post('/students', isAdmin, async (req, res) => {
  try {
    const { name, email, password, selectedUnits } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get available Ganache accounts
    const accounts = await web3.eth.getAccounts();
    const adminAddress = accounts[0]; // First account is admin
    const usedAddresses = await Student.find({}, 'blockchainAddress');
    const usedAddressSet = new Set(usedAddresses.map(s => s.blockchainAddress.toLowerCase()));

    // Find first available address
    const availableAddress = accounts.find(addr => 
      addr.toLowerCase() !== adminAddress.toLowerCase() && 
      !usedAddressSet.has(addr.toLowerCase())
    );

    if (!availableAddress) {
      return res.status(400).json({
        success: false,
        message: 'No available blockchain addresses'
      });
    }

    // Create student in database
    const student = new Student({
      name,
      email,
      password,
      role: 'student',
      blockchainAddress: availableAddress,
      units: Array.isArray(selectedUnits) ? selectedUnits : []
    });
    
    await student.save();
    
    // Store additional data on blockchain
    const contract = new web3.eth.Contract(contractConfig.studentRegistry.abi, contractConfig.studentRegistry.address);

    // Create student data object
    const studentData = {
      name,
      email,
      blockchainAddress: availableAddress,
      studentId: student._id.toString(),
      subjects: Array.isArray(selectedUnits) ? selectedUnits : []
    };

    // Store student data on blockchain
    await contract.methods.storeStudentData(
      availableAddress,
      JSON.stringify(studentData)
    ).send({ 
      from: adminAddress, 
      gas: 300000 
    });

    // Update student statistics
    const stats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "active"] }, 1, 0] 
            } 
          },
          recentStudents: {
            $push: {
              name: "$name",
              email: "$email",
              createdAt: "$createdAt"
            }
          }
        }
      }
    ]);

    // Update dashboard statistics
    await DashboardStats.findOneAndUpdate(
      {},
      {
        $inc: { totalStudents: 1 },
        $set: {
          lastUpdated: new Date(),
          studentStats: stats[0] || {
            totalStudents: 0,
            activeStudents: 0,
            recentStudents: []
          }
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Student created successfully',
      student: {
        name,
        email,
        blockchainAddress: availableAddress
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating student'
    });
  }
});

// Subject Management Routes
router.get('/subjects', isAdmin, (req, res) => {
  res.render('admin/subjects', {
    subjects: adminData.subjects
  });
});

router.post('/subjects', isAdmin, async (req, res) => {
  try {
    const { code, name, credits, description } = req.body;
    
    // Create new subject
    const newSubject = {
      id: Date.now().toString(),
      code,
      name,
      credits,
      description,
      status: 'active',
      createdAt: new Date()
    };
    
    adminData.subjects.push(newSubject);
    res.json({ success: true, subject: newSubject });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ success: false, message: 'Error adding subject' });
  }
});

// Certificate Management Routes
router.get('/certificates', isAdmin, (req, res) => {
  res.render('admin/certificates', {
    certificates: adminData.certificates,
    students: adminData.students
  });
});

router.post('/certificates', isAdmin, async (req, res) => {
  try {
    const { studentId, title, description, issueDate } = req.body;
    
    // Find student
    const student = adminData.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Create new certificate
    const newCertificate = {
      id: Date.now().toString(),
      studentId,
      studentName: student.name,
      studentAddress: student.blockchainAddress,
      title,
      description,
      issueDate,
      status: 'pending',
      createdAt: new Date()
    };
    
    adminData.certificates.push(newCertificate);
    adminData.stats.total++;
    adminData.stats.pending++;
    
    res.json({ success: true, certificate: newCertificate });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ success: false, message: 'Error generating certificate' });
  }
});

// Admin login routes
router.get('/login', (req, res) => {
  const message = req.query.message || '';
  res.render('adminlogin', { 
    message: message,
    title: 'Admin Login'
  });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.redirect('/admin/login?message=Username and password are required');
    }

    // Verify credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Set session
      req.session.isAdmin = true;
      req.session.adminAddress = ADMIN_CREDENTIALS.address;
      req.session.user = {
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
        address: ADMIN_CREDENTIALS.address
      };

      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/admin/login?message=Invalid username or password');
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.redirect('/admin/login?message=Server error occurred');
  }
});

// General Settings Route
router.get('/settings/general', isAdmin, (req, res) => {
  try {
    // Get current settings
    const settings = {
      instituteName: process.env.INSTITUTE_NAME || 'JKUAT',
      instituteEmail: process.env.INSTITUTE_EMAIL || 'admin@jkuat.ac.ke',
      maxStudents: process.env.MAX_STUDENTS || '1000',
      certificateExpiry: process.env.CERTIFICATE_EXPIRY || '365', // days
      blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'Ganache',
      web3Provider: process.env.WEB3_PROVIDER || 'http://127.0.0.1:7545'
    };

    res.render('admin/settings/general', {
      user: req.session.user,
      settings: settings,
      error: null
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    res.render('admin/settings/general', {
      user: req.session.user,
      settings: {},
      error: 'Error loading settings'
    });
  }
});

// Update General Settings
router.post('/settings/general', isAdmin, async (req, res) => {
  try {
    const { 
      instituteName, 
      instituteEmail, 
      maxStudents, 
      certificateExpiry,
      blockchainNetwork,
      web3Provider
    } = req.body;

    // Validate required fields
    if (!instituteName || !instituteEmail) {
      return res.status(400).json({
        success: false,
        message: 'Institute name and email are required'
      });
    }

    // Update settings (in a real app, these would be saved to a database)
    process.env.INSTITUTE_NAME = instituteName;
    process.env.INSTITUTE_EMAIL = instituteEmail;
    process.env.MAX_STUDENTS = maxStudents;
    process.env.CERTIFICATE_EXPIRY = certificateExpiry;
    process.env.BLOCKCHAIN_NETWORK = blockchainNetwork;
    process.env.WEB3_PROVIDER = web3Provider;

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

module.exports = router;