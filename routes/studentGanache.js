const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const User = require('../models/User');

// Initialize Web3 with Ganache provider
const web3Provider = process.env.WEB3_PROVIDER || 'http://127.0.0.1:7545';
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));

// Get available Ganache accounts for students
router.get('/available-accounts', async (req, res) => {
    try {
        // Get all Ganache accounts
        const accounts = await web3.eth.getAccounts();
        
        // Get used addresses from database
        const usedAddresses = await User.find({}, 'blockchainAddress');
        const usedAddressSet = new Set(usedAddresses.map(s => 
            s.blockchainAddress ? s.blockchainAddress.toLowerCase() : null
        ));

        // Filter out admin (first) and institute (second) accounts
        const availableAddresses = accounts.slice(2).filter(addr => 
            !usedAddressSet.has(addr.toLowerCase())
        );

        res.json({ success: true, accounts: availableAddresses });
    } catch (error) {
        console.error('Error getting available accounts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Student Ganache login page
router.get('/login', (req, res) => {
    res.render('studentGanacheLogin', { 
        message: null,
        title: 'Student Login with Ganache Account'
    });
});

// Process student login
router.post('/login', async (req, res) => {
    try {
        const { blockchainAddress } = req.body;

        if (!blockchainAddress) {
            return res.render('studentGanacheLogin', {
                message: 'Blockchain address is required'
            });
        }

        // Validate blockchain address format
        if (!web3.utils.isAddress(blockchainAddress)) {
            return res.render('studentGanacheLogin', {
                message: 'Invalid blockchain address format'
            });
        }

        // Get all Ganache accounts
        const accounts = await web3.eth.getAccounts();
        
        // Check if address is a valid Ganache account (excluding admin and institute)
        const isValidGanacheAccount = accounts.slice(2).includes(blockchainAddress.toLowerCase());
        
        if (!isValidGanacheAccount) {
            return res.render('studentGanacheLogin', {
                message: 'Invalid Ganache account or account not available for students'
            });
        }

        // Find or create student account
        let student = await User.findOne({ 
            blockchainAddress: blockchainAddress.toLowerCase(),
            role: 'student'
        });

        if (!student) {
            // Create new student account if it doesn't exist
            student = new User({
                name: `Student ${blockchainAddress.slice(0, 6)}`,
                email: `${blockchainAddress.slice(2, 8)}@student.certify.com`,
                blockchainAddress: blockchainAddress.toLowerCase(),
                role: 'student',
                status: 'active'
            });
            await student.save();
        }

        // Set session data
        req.session.user = {
            _id: student._id,
            name: student.name,
            email: student.email,
            blockchainAddress: student.blockchainAddress,
            role: 'student'
        };

        res.redirect('/student/dashboard');
    } catch (error) {
        console.error('Student login error:', error);
        res.render('studentGanacheLogin', {
            message: 'Server error occurred'
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

module.exports = router;