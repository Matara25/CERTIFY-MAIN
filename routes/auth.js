const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const web3 = require('web3');
const Student = require('../models/Student');

// Render login page
router.get('/login', (req, res) => {
  res.render('auth/login', { message: req.query.message });
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword
    });

    // Save user to database
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', { message: 'Invalid credentials' });
    }

    // Set session data
    req.session.userId = user._id;
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.session.isAdmin = user.role === 'admin';
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/login', { message: 'Server error occurred' });
      }
      
      console.log('Session after login:', req.session);

      // Redirect based on role
      if (user.role === 'admin') {
        res.redirect('/admin/dashboard');
      } else {
        res.redirect('/dashboard');
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { message: 'Server error occurred' });
  }
});

// Student login route
router.post('/student-login', async (req, res) => {
  try {
    const { blockchainAddress } = req.body;

    if (!blockchainAddress) {
      return res.render('studentlogin', { 
        message: 'Blockchain address is required' 
      });
    }

    // Validate blockchain address format
    if (!web3.utils.isAddress(blockchainAddress)) {
      return res.render('studentlogin', { 
        message: 'Invalid blockchain address format' 
      });
    }

    // Get all available Ganache accounts
    const accounts = await web3.eth.getAccounts();
    
    // Check if the address exists in Ganache
    if (!accounts.includes(blockchainAddress.toLowerCase())) {
      return res.render('studentlogin', { 
        message: 'Blockchain address not found in the system' 
      });
    }

    // Find student by blockchain address
    const student = await Student.findOne({ 
      blockchainAddress: blockchainAddress.toLowerCase(),
      role: 'student'
    });

    if (!student) {
      return res.render('studentlogin', { 
        message: 'No student found with this blockchain address' 
      });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Set session data
    req.session.user = {
      _id: student._id,
      name: student.name,
      email: student.email,
      blockchainAddress: student.blockchainAddress,
      role: 'student'
    };

    // Save session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('studentlogin', { 
          message: 'Server error occurred' 
        });
      }
      
      res.redirect('/student/dashboard');
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.render('studentlogin', { 
      message: 'Server error occurred' 
    });
  }
});

// Comrade Login Page
router.get('/comrade-login', (req, res) => {
    res.render('comradelogin', { error: null });
});

// Comrade Login Process
router.post('/comrade-login', async (req, res) => {
    try {
        const { blockchainAddress } = req.body;

        // Validate blockchain address
        if (!blockchainAddress) {
            return res.render('comradelogin', { 
                error: 'Blockchain address is required' 
            });
        }

        // Check if address is valid
        if (!web3.utils.isAddress(blockchainAddress)) {
            return res.render('comradelogin', { 
                error: 'Invalid blockchain address format' 
            });
        }

        // Get all available Ganache accounts
        const accounts = await web3.eth.getAccounts();
        
        // Check if address exists in Ganache
        const addressExists = accounts.some(account => 
            account.toLowerCase() === blockchainAddress.toLowerCase()
        );

        if (!addressExists) {
            return res.render('comradelogin', { 
                error: 'Blockchain address not found in the system' 
            });
        }

        // Find comrade in database
        const comrade = await Student.findOne({ 
            blockchainAddress: blockchainAddress.toLowerCase() 
        });

        if (!comrade) {
            return res.render('comradelogin', { 
                error: 'No account found with this blockchain address' 
            });
        }

        // Update last login
        comrade.lastLogin = new Date();
        await comrade.save();

        // Create session
        req.session.user = {
            id: comrade._id,
            name: comrade.name,
            email: comrade.email,
            role: 'comrade',
            blockchainAddress: comrade.blockchainAddress
        };

        res.redirect('/comrade/home');
    } catch (error) {
        console.error('Comrade login error:', error);
        res.render('comradelogin', { 
            error: 'An error occurred during login. Please try again.' 
        });
    }
});

module.exports = router; 