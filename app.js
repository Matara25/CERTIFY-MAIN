// Blockchain imports
const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const Accounts = require('web3-eth-accounts');
const contractConfig = require('./config/contract');

// MongoDB and Express imports
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
require('dotenv').config();

// Load models after mongoose connection
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const Student = require('./models/student');

// Load routes after models
const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');
const instituteRoutes = require('./routes/institute');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const studentGanacheRoutes = require('./routes/studentGanache');

const app = express();

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://Matara:Matara@cluster0.imhm6pq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    // Start server only after MongoDB connection is established
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize Web3 with provider from environment variables
const web3Provider = process.env.WEB3_PROVIDER;
if (!web3Provider) {
  console.error('WEB3_PROVIDER environment variable is not set');
  process.exit(1);
}
console.log('Using Web3 provider:', web3Provider);

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));

// Verify Web3 connection
web3.eth.net.isListening()
  .then(() => console.log('Web3 is connected to provider:', web3Provider))
  .catch(err => {
    console.error('Web3 connection error:', err);
    console.error('Please ensure Ganache is running on:', web3Provider);
    process.exit(1);
  });

// Initialize contract
const contract = new web3.eth.Contract(
  contractConfig.certificate.abi,
  contractConfig.certificate.address
);
console.log('Contract initialized with address:', contractConfig.certificate.address);

// Verify contract methods
console.log('Available contract methods:', Object.keys(contract.methods));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/home', express.static(path.join(__dirname, 'public/home')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Root route
app.get('/', (req, res) => {
  res.render('home', { 
    title: 'Certify - Home',
    message: null 
  });
});

// View certificate by address
app.post('/viewcertificate', async (req, res) => {
  try {
    const { addr } = req.body;
    
    if (!addr) {
      return res.render('error', { message: 'Certificate address is required' });
    }
    
    // Find certificate by blockchain hash
    const certificate = await Certificate.findOne({ blockchainHash: addr })
      .populate('issuedTo', 'name blockchainAddress')
      .populate('issuedBy', 'name blockchainAddress');
    
    if (!certificate) {
      return res.render('error', { message: 'Certificate not found' });
    }
    
    res.render('viewcertificate', { certificate });
  } catch (error) {
    console.error('Error viewing certificate:', error);
    res.render('error', { message: 'Error viewing certificate', error: error.message });
  }
});

// Routes - Institute routes should be accessible without admin login
app.use('/institute', instituteRoutes);
app.use('/student-ganache', studentGanacheRoutes);

// Other routes
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/certificates', certificateRoutes);
app.use('/student', studentRoutes);

// Admin login route
app.get('/adminlogin', (req, res) => {
  res.render('adminlogin', { error: null });
});

app.post('/adminlogin', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Admin login attempt:');
    console.log('- Username:', username);
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.render('adminlogin', { error: 'Please enter both username and password' });
    }

    // Find admin by username only first
    const admin = await User.findOne({ username: username });
    
    if (!admin) {
      console.log('No user found with username:', username);
      return res.render('adminlogin', { error: 'Invalid username or password' });
    }

    console.log('Found user:');
    console.log('- Role:', admin.role);
    console.log('- Status:', admin.status);
    console.log('- Email:', admin.email);
    console.log('- Blockchain Address:', admin.blockchainAddress);

    // Check if user is an admin
    if (admin.role !== 'admin') {
      console.log('User is not an admin');
      return res.render('adminlogin', { error: 'Invalid username or password' });
    }

    // Verify password using User model's method
    const isMatch = await admin.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.render('adminlogin', { error: 'Invalid username or password' });
    }
    
    // Set session data
    req.session.userId = admin._id;
    req.session.user = {
      _id: admin._id,
      name: admin.name,
      role: 'admin',
      email: admin.email,
      blockchainAddress: admin.blockchainAddress
    };
    req.session.isAdmin = true;
    
    console.log('Admin login successful, session data:');
    console.log('- Session ID:', req.session.id);
    console.log('- User ID:', req.session.userId);
    console.log('- Is Admin:', req.session.isAdmin);
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('adminlogin', { error: 'Server error occurred' });
  }
});

// Route to create admin with generated credentials
app.post('/create-admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    const result = await createAdminWithCredentials(username, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Admin user created successfully',
        username: result.username,
        password: result.password
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Institute login route
app.get('/institutelogin', (req, res) => {
  res.render('institutelogin', { error: null });
});

app.post('/institutelogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Institute login attempt:');
    console.log('- Email:', email);
    console.log('- Password provided:', !!password);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.render('institutelogin', { error: 'Please enter both email and password' });
    }

    // Find institute by email
    const institute = await User.findOne({ email: email, role: 'issuer' });
    
    if (!institute) {
      console.log('No institute found with email:', email);
      return res.render('institutelogin', { error: 'Invalid email or password' });
    }

    console.log('Found institute:');
    console.log('- Role:', institute.role);
    console.log('- Status:', institute.status);
    console.log('- Email:', institute.email);
    console.log('- Blockchain Address:', institute.blockchainAddress);

    // Verify password using User model's method
    const isMatch = await institute.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.render('institutelogin', { error: 'Invalid email or password' });
    }
    
    // Set session data
    req.session.userId = institute._id;
    req.session.user = {
      _id: institute._id,
      name: institute.name,
      role: 'issuer',
      email: institute.email,
      blockchainAddress: institute.blockchainAddress
    };
    req.session.isIssuer = true;
    
    console.log('Institute login successful, session data:');
    console.log('- Session ID:', req.session.id);
    console.log('- User ID:', req.session.userId);
    console.log('- Is Issuer:', req.session.isIssuer);
    
    res.redirect('/institute/dashboard');
  } catch (error) {
    console.error('Institute login error:', error);
    res.render('institutelogin', { error: 'Server error occurred' });
  }
});

// Add student route
app.get('/addstudent', (req, res) => {
  res.render('addstudent', { error: null, success: null });
});

// View students route
app.get('/viewstudents', async (req, res) => {
  try {
    // Get all students with complete information from MongoDB
    const students = await User.find({ role: 'student' })
      .select('name email blockchainAddress registrationNumber subjects completedUnits')
      .sort({ createdAt: -1 });
    
    res.render('viewstudents', { 
      students,
      error: null
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.render('viewstudents', { 
      students: [],
      error: 'Error fetching students: ' + error.message
    });
  }
});

app.post('/addstudent', async (req, res) => {
  console.log('Received add student request:', req.body);
  try {
    const { name, email, password = 'student123', registrationNumber, blockchainAddress, subjects } = req.body;
    
    console.log('Processing student data:', {
      name,
      email,
      registrationNumber,
      subjects
    });
    
    // Convert subjects to array if it's a single value
    const subjectsArray = Array.isArray(subjects) ? subjects : [subjects];
    
    // Store critical information in MongoDB
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      registrationNumber,
      blockchainAddress,
      role: 'student',
      status: 'active',
      subjects: subjectsArray,
      createdAt: new Date()
    });

    console.log('Saving student to database...');
    await newUser.save();
    console.log('Student saved successfully:', newUser._id);
    
    res.render('addstudent', { 
      success: 'Student added successfully! Default password: student123',
      error: null 
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.render('addstudent', { 
      error: 'Error adding student: ' + error.message,
      success: null 
    });
  }
});

// Generate certificate route
app.post('/generate-certificate/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { certificateTitle } = req.body;

    if (!certificateTitle) {
      return res.status(400).json({ 
        success: false, 
        error: 'Certificate title is required' 
      });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Check if all subjects are completed
    const totalSubjects = student.subjects.length;
    const completedSubjects = student.completedUnits.length;
    const allUnitsCompleted = totalSubjects > 0 && completedSubjects === totalSubjects;

    if (!allUnitsCompleted) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot generate certificate: Only ${completedSubjects}/${totalSubjects} units completed` 
      });
    }

    // Get admin account
    const accounts = await web3.eth.getAccounts();
    const adminAccount = accounts[0];

    // Generate a unique certificate address
    const certificateAddress = web3.utils.randomHex(20);
    
    // Create certificate in MongoDB
    const certificate = new Certificate({
      title: certificateTitle,
      issuedTo: student._id,
      issuedBy: req.session.userId, // Admin's ID
      description: `Certificate of completion for ${student.name}`,
      status: 'active',
      blockchainHash: certificateAddress,
      metadata: {
        studentName: student.name,
        completedUnits: student.completedUnits,
        totalUnits: student.subjects.length,
        completionDate: new Date()
      }
    });

    await certificate.save();

    // Issue certificate on blockchain
    const contract = new web3.eth.Contract(
      contractConfig.certificate.abi,
      contractConfig.certificate.address
    );

    const txData = contract.methods.issueCertificate(
      certificateAddress,
      student.blockchainAddress,
      `${student.name}'s Certificate of Completion`,
      student.subjects.length // duration/units completed
    ).encodeABI();

    const tx = {
      from: adminAccount,
      to: contractConfig.certificate.address,
      gas: 2000000,
      data: txData
    };

    const receipt = await web3.eth.sendTransaction(tx);

    // Update dashboard stats
    await DashboardStats.findOneAndUpdate(
      {},
      {
        $inc: { totalCertificates: 1 },
        $push: {
          'certificateStats.recentIssued': {
            studentName: student.name,
            unitCode: 'ALL',
            issueDate: new Date()
          }
        }
      },
      { upsert: true }
    );

    res.json({ 
      success: true, 
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate._id,
        title: certificateTitle,
        blockchainAddress: certificateAddress,
        transactionHash: receipt.transactionHash
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generating certificate: ' + error.message 
    });
  }
});

// Mark unit as completed
app.post('/complete-unit/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { unit } = req.body;

    if (!unit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unit name is required' 
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Check if the unit exists in student's subjects
    if (!student.subjects.includes(unit)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unit not found in student subjects' 
      });
    }

    // Add unit to completedUnits if not already there
    if (!student.completedUnits.includes(unit)) {
      student.completedUnits.push(unit);
      await student.save();
    }

    res.json({ 
      success: true, 
      message: 'Unit marked as completed',
      completedUnits: student.completedUnits
    });
  } catch (error) {
    console.error('Error marking unit as completed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error marking unit as completed: ' + error.message 
    });
  }
});

// Institute routes
app.get('/institute/dashboard', (req, res) => {
  res.render('institute/dashboard');
});

app.get('/institute/add', (req, res) => {
  res.render('institute/add');
});

app.post('/institute/add', async (req, res) => {
  try {
    const { name, username, password, blockchainAddress } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new institute with auto-generated email
    const institute = new User({
      name,
      username,
      email: `${username}@certify.com`, // Automatically generate email
      password: hashedPassword,
      blockchainAddress,
      role: 'issuer',
      status: 'active'
    });

    await institute.save();

    res.redirect('/institute/dashboard');
  } catch (error) {
    console.error('Error adding institute:', error);
    res.render('institute/add', { 
      error: 'Error adding institute: ' + error.message 
    });
  }
});

app.get('/institute/view', async (req, res) => {
  try {
    const institutes = await User.find({ role: 'issuer' });
    res.render('institute/view', { institutes });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.render('institute/view', { 
      institutes: [],
      error: 'Error fetching institutes: ' + error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { 
    message: err.message || 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;