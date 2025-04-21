const { exec } = require('child_process');
require('dotenv').config();

const verifyContract = async (network, contractAddress) => {
  // Validate network
  if (network === 'development') {
    throw new Error('Contract verification is not supported on the development network. Please use a public network like sepolia or mainnet.');
  }

  // Check if ETHERSCAN_API_KEY is set
  if (!process.env.ETHERSCAN_API_KEY) {
    throw new Error('ETHERSCAN_API_KEY is not set in .env file');
  }

  // Check if contract address is valid
  if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    throw new Error('Invalid contract address format');
  }

  const command = `truffle run verify Certificate@${contractAddress} --network ${network}`;
  
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error verifying contract: ${error.message}`);
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
        }
        reject(error);
        return;
      }
      console.log(`Contract verification output: ${stdout}`);
      resolve(stdout);
    });
  });
};

// Example usage
const network = process.env.NETWORK || 'sepolia'; // Default to sepolia testnet
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
  console.error('Please set CONTRACT_ADDRESS in your .env file');
  process.exit(1);
}

console.log('Starting contract verification...');
console.log(`Network: ${network}`);
console.log(`Contract Address: ${contractAddress}`);

verifyContract(network, contractAddress)
  .then(() => {
    console.log('✅ Contract verification completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Contract verification failed:', err.message);
    process.exit(1);
  }); 