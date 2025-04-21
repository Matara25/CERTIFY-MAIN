// Test script to verify contract initialization
const Web3 = require('web3');
const contractConfig = require('./config/contract');
require('dotenv').config();

// Initialize Web3 with provider from environment variables
const web3Provider = process.env.WEB3_PROVIDER || 'http://127.0.0.1:7545';
console.log('Using Web3 provider:', web3Provider);

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));

// Verify Web3 connection
web3.eth.net.isListening()
  .then(() => {
    console.log('Web3 is connected to provider:', web3Provider);
    
    // Get accounts
    return web3.eth.getAccounts();
  })
  .then(accounts => {
    console.log('Available accounts:', accounts);
    
    // Initialize contract
    console.log('Initializing contract with address:', contractConfig.certificate.address);
    console.log('ABI length:', contractConfig.certificate.abi.length);
    
    const contract = new web3.eth.Contract(contractConfig.certificate.abi, contractConfig.certificate.address);
    console.log('Contract initialized successfully');
    
    // Return success
    return true;
  })
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 