const axios = require('axios');

// Etherscan API key
const ETHERSCAN_API_KEY = 'SPJJAGBWHRHHTX5X4SMIPCN4S9AGE2CKI3';

// The block hash to verify
const blockHash = '0x8123d80f64f2ff5a752d2b296d24ccf0e7adca4c1f10540a115ec952fd42a550';

/**
 * Verifies a block hash using Etherscan API
 * @param {string} hash - The block hash to verify (with 0x prefix)
 * @param {string} apiKey - Etherscan API key
 * @returns {Promise<Object>} - Verification result
 */
async function verifyBlockHash(hash = blockHash, apiKey = ETHERSCAN_API_KEY) {
  try {
    console.log(`Verifying block hash: ${hash}`);
    
    // Query Etherscan API
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'block',
        action: 'getblockbyhash',
        tag: hash,
        boolean: true,
        apikey: apiKey
      }
    });

    // Check if the request was successful
    if (response.data.status === '1' && response.data.result) {
      const block = response.data.result;
      console.log('✅ Block found!');
      console.log(`Block number: ${block.blockNumber}`);
      console.log(`Block hash: ${block.hash}`);
      console.log(`Timestamp: ${new Date(block.timeStamp * 1000).toLocaleString()}`);
      console.log(`Transactions: ${block.transactions.length}`);
      
      return {
        success: true,
        block: {
          number: block.blockNumber,
          hash: block.hash,
          timestamp: new Date(block.timeStamp * 1000).toLocaleString(),
          transactionCount: block.transactions.length
        }
      };
    } else {
      console.log('❌ Block not found on Etherscan.');
      console.log('Response:', response.data);
      
      return {
        success: false,
        message: response.data.message || 'Block not found',
        data: response.data
      };
    }
  } catch (error) {
    console.error('Error verifying block hash:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
      data: error.response ? error.response.data : null
    };
  }
}

// Run the verification
verifyBlockHash()
  .then(result => {
    if (result.success) {
      console.log('Verification successful!');
    } else {
      console.log('Verification failed:', result.message || result.error);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });

// Export the function for use in other files
module.exports = verifyBlockHash; 