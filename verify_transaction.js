const axios = require('axios');

// Replace with your Etherscan API key
const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY';

// The block hash to verify
const blockHash = '0x8123d80f64f2ff5a752d2b296d24ccf0e7adca4c1f10540a115ec952fd42a550';

// If you have a transaction hash, you can add it here
// const txHash = '0x...';

async function verifyTransaction() {
  try {
    // First, try to get the block by hash
    const blockResponse = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'block',
        action: 'getblockbyhash',
        tag: blockHash,
        boolean: true,
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (blockResponse.data.status === '1' && blockResponse.data.result) {
      console.log('Block found!');
      console.log('Block number:', blockResponse.data.result.blockNumber);
      console.log('Block hash:', blockResponse.data.result.hash);
      console.log('Timestamp:', new Date(blockResponse.data.result.timeStamp * 1000).toLocaleString());
      console.log('Transactions:', blockResponse.data.result.transactions.length);
      
      // If you have a transaction hash, you can check if it's in this block
      if (typeof txHash !== 'undefined') {
        const txInBlock = blockResponse.data.result.transactions.some(tx => tx.hash === txHash);
        if (txInBlock) {
          console.log(`Transaction ${txHash} is confirmed in this block!`);
        } else {
          console.log(`Transaction ${txHash} is NOT in this block.`);
        }
      }
      
      return true;
    } else {
      console.log('Block not found on Etherscan.');
      console.log('Response:', blockResponse.data);
      
      // Try to get the block by number if we have it
      if (blockResponse.data.message && blockResponse.data.message.includes('block number')) {
        const blockNumber = blockResponse.data.message.match(/\d+/)[0];
        console.log(`Trying to get block number ${blockNumber} instead...`);
        
        const blockByNumberResponse = await axios.get(`https://api.etherscan.io/api`, {
          params: {
            module: 'block',
            action: 'getblockreward',
            blockno: blockNumber,
            apikey: ETHERSCAN_API_KEY
          }
        });
        
        if (blockByNumberResponse.data.status === '1' && blockByNumberResponse.data.result) {
          console.log('Block found by number!');
          console.log('Block number:', blockByNumberResponse.data.result.blockNumber);
          console.log('Block hash:', blockByNumberResponse.data.result.blockHash);
          console.log('Timestamp:', new Date(blockByNumberResponse.data.result.timeStamp * 1000).toLocaleString());
          return true;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error verifying block hash:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the verification
verifyTransaction(); 