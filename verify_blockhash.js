const axios = require('axios');

// Replace with your Etherscan API key
const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY';

// The block hash to verify
const blockHash = '0x8123d80f64f2ff5a752d2b296d24ccf0e7adca4c1f10540a115ec952fd42a550';

async function verifyBlockHash() {
  try {
    // First, try to get the block by hash
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'block',
        action: 'getblockbyhash',
        tag: blockHash,
        boolean: true,
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (response.data.status === '1' && response.data.result) {
      console.log('Block found!');
      console.log('Block number:', response.data.result.blockNumber);
      console.log('Block hash:', response.data.result.hash);
      console.log('Timestamp:', new Date(response.data.result.timeStamp * 1000).toLocaleString());
      console.log('Transactions:', response.data.result.transactions.length);
      return true;
    } else {
      console.log('Block not found on Etherscan.');
      console.log('Response:', response.data);
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
verifyBlockHash(); 