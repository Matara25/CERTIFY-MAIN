const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { generateRegistrationNumber } = require('../utils/certificateUtils');
const Web3 = require('web3');
const contractConfig = require('../config/contract');

// Initialize Web3
const web3Provider = process.env.WEB3_PROVIDER || 'http://127.0.0.1:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Helper function to get available accounts
async function getAvailableAccounts() {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw new Error('Failed to get available accounts');
  }
}

// Issue certificate (stores in both blockchain and MongoDB)
router.post('/issue', isAdmin, async (req, res) => {
  try {
    const {
      studentAddress,
      courseName,
      duration,
      grade,
      expiryDate,
      metadata
    } = req.body;

    // Get available accounts
    const accounts = await getAvailableAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No available accounts found');
    }

    // Select an account for the certificate (using the first available account)
    const certificateAddress = accounts[0];

    // Generate unique registration number
    const registrationNumber = await generateRegistrationNumber();

    // First, issue certificate on blockchain
    const contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
    const result = await contract.methods.issueCertificate(
      certificateAddress,
      accounts[1], // Using second account as institute address
      studentAddress,
      courseName,
      duration
    ).send({
      from: accounts[1], // Using second account as the sender
      gas: 6721975
    });

    // Then store in MongoDB with additional metadata
    const certificate = new Certificate({
      blockchainAddress: certificateAddress,
      registrationNumber,
      studentAddress,
      instituteAddress: accounts[1],
      courseName,
      duration,
      grade,
      expiryDate: new Date(expiryDate),
      metadata: {
        ...metadata,
        issuingAuthority: accounts[1]
      }
    });

    await certificate.save();

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateAddress: certificate.blockchainAddress,
      registrationNumber: certificate.registrationNumber,
      instituteAddress: accounts[1]
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ 
      message: 'Error issuing certificate',
      error: error.message 
    });
  }
});

// Get certificate by ID or blockchain address
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: req.params.id },
        { blockchainAddress: req.params.id }
      ]
    }).populate('issuedTo issuedBy');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving certificate', error: error.message });
  }
});

// Revoke certificate
router.post('/:id/revoke', isAdmin, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: req.params.id },
        { blockchainAddress: req.params.id }
      ]
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // First revoke on blockchain
    const contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
    await contract.methods.revokeCertificate(certificate.blockchainAddress)
      .send({ from: accounts[1] });

    // Then update MongoDB
    await certificate.revoke(req.session.userId, req.body.reason);
    res.json({ message: 'Certificate revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking certificate', error: error.message });
  }
});

// View certificate (combines data from blockchain and MongoDB)
router.get('/view/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    let certificate;

    // Try to find by registration number first, then by blockchain address
    if (identifier.startsWith('REG')) {
      certificate = await Certificate.findByRegistrationNumber(identifier);
    } else {
      certificate = await Certificate.findOne({ blockchainAddress: identifier });
    }

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Get certificate data from blockchain
    const blockchainData = await contract.methods.viewCertificate(certificate.blockchainAddress)
      .call({ from: adminad });

    // Combine data from both sources
    const certificateData = {
      ...certificate.toObject(),
      blockchain: {
        isValid: !blockchainData.del,
        timestamp: blockchainData.timestamp
      }
    };

    res.json(certificateData);
  } catch (error) {
    console.error('Error viewing certificate:', error);
    res.status(500).json({ message: 'Error retrieving certificate' });
  }
});

// Verify certificate
router.post('/verify/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const { verifiedBy, notes } = req.body;

    let certificate;
    if (identifier.startsWith('REG')) {
      certificate = await Certificate.findByRegistrationNumber(identifier);
    } else {
      certificate = await Certificate.findOne({ blockchainAddress: identifier });
    }

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Verify against blockchain
    const blockchainData = await contract.methods.viewCertificate(certificate.blockchainAddress)
      .call({ from: adminad });

    const isValid = !blockchainData.del && certificate.isValid();

    // Add verification record
    certificate.verificationHistory.push({
      verifiedBy,
      verifiedAt: new Date(),
      status: isValid ? 'VALID' : 'INVALID',
      notes
    });

    await certificate.save();

    res.json({
      isValid,
      certificate: {
        registrationNumber: certificate.registrationNumber,
        blockchainAddress: certificate.blockchainAddress,
        studentName: certificate.metadata.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        isRevoked: certificate.isRevoked
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Error verifying certificate' });
  }
});

// Get all certificates for a student
router.get('/student/:address', async (req, res) => {
  try {
    const studentAddress = req.params.address;
    const certificates = await Certificate.findByStudent(studentAddress);

    // Verify each certificate against blockchain
    const verifiedCertificates = await Promise.all(
      certificates.map(async (cert) => {
        const blockchainData = await contract.methods.viewCertificate(cert.blockchainAddress)
          .call({ from: adminad });
        
        return {
          ...cert.toObject(),
          blockchain: {
            isValid: !blockchainData.del,
            timestamp: blockchainData.timestamp
          }
        };
      })
    );

    res.json(verifiedCertificates);
  } catch (error) {
    console.error('Error getting student certificates:', error);
    res.status(500).json({ message: 'Error retrieving certificates' });
  }
});

// Public route to verify a certificate
router.post('/verify', async (req, res) => {
  try {
    const { certificateId, blockchainHash } = req.body;

    if (!certificateId || !blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID and blockchain hash are required'
      });
    }

    // Find certificate in database
    const certificate = await Certificate.findOne({ 
      certificateId: certificateId,
      blockchainHash: blockchainHash
    }).populate('issuedTo', 'name email')
      .populate('issuedBy', 'name email');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Verify on blockchain
    const contract = new web3.eth.Contract(
      contractConfig.certificate.abi,
      contractConfig.certificate.address
    );

    try {
      const isValid = await contract.methods.verifyCertificate(certificate.blockchainHash).call();
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Certificate is not valid on the blockchain'
        });
      }
    } catch (error) {
      console.error('Blockchain verification error:', error);
      // If Ganache is not available, fall back to database verification
      console.log('Falling back to database verification');
    }

    // Check certificate validity in database
    if (!certificate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is not valid (revoked or expired)'
      });
    }

    // Return certificate details
    return res.json({
      success: true,
      message: 'Certificate verified successfully',
      certificate: {
        id: certificate.certificateId,
        title: certificate.title,
        description: certificate.description,
        issuedTo: {
          name: certificate.issuedTo.name,
          email: certificate.issuedTo.email
        },
        issuedBy: {
          name: certificate.issuedBy.name,
          email: certificate.issuedBy.email
        },
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        status: certificate.status
      }
    });

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate'
    });
  }
});

// Public route to verify certificate and render result page
router.get('/verify/:certificateId/:blockchainHash', async (req, res) => {
  try {
    const { certificateId, blockchainHash } = req.params;

    // Find certificate in database
    const certificate = await Certificate.findOne({ 
      certificateId: certificateId,
      blockchainHash: blockchainHash
    }).populate('issuedTo', 'name email')
      .populate('issuedBy', 'name email');

    if (!certificate) {
      return res.render('verify-certificate', { 
        success: false,
        message: 'Certificate not found',
        certificate: null
      });
    }

    // Check certificate validity
    const isValid = certificate.isValid();

    res.render('verify-certificate', {
      success: isValid,
      message: isValid ? 'Certificate verified successfully' : 'Certificate is not valid (revoked or expired)',
      certificate: isValid ? {
        id: certificate.certificateId,
        title: certificate.title,
        description: certificate.description,
        issuedTo: certificate.issuedTo,
        issuedBy: certificate.issuedBy,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        status: certificate.status
      } : null
    });

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.render('verify-certificate', {
      success: false,
      message: 'Error verifying certificate',
      certificate: null
    });
  }
});

module.exports = router;