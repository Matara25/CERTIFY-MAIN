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
    console.log('Making API request...');
    
    // Query Etherscan API
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'block',
        action: 'getblockreward',
        blockno: hash,
        apikey: apiKey
      }
    });

    console.log('Raw API Response:', JSON.stringify(response.data, null, 2));

    // Check if the request was successful and has data
    if (response.data && response.data.status === '1' && response.data.result) {
      const block = response.data.result;
      
      console.log('✅ Block found!');
      console.log('Block details:');
      console.log('--------------');
      console.log(`Block number: ${block.blockNumber}`);
      console.log(`Block miner: ${block.blockMiner}`);
      console.log(`Block reward: ${block.blockReward} ETH`);
      console.log(`Timestamp: ${new Date(parseInt(block.timeStamp) * 1000).toLocaleString()}`);
      
      return {
        success: true,
        block: {
          number: block.blockNumber,
          miner: block.blockMiner,
          reward: block.blockReward,
          timestamp: new Date(parseInt(block.timeStamp) * 1000).toLocaleString()
        }
      };
    } else {
      console.log('❌ Block not found on Etherscan.');
      console.log('Error details:');
      console.log('--------------');
      if (response.data.error) {
        console.log('API Error:', response.data.error);
      }
      if (response.data.message) {
        console.log('Message:', response.data.message);
      }
      
      return {
        success: false,
        message: (response.data.error && response.data.error.message) || response.data.message || 'Block not found',
        data: response.data
      };
    }
  } catch (error) {
    console.error('Error verifying block hash:');
    console.error('--------------------------');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      success: false,
      error: error.message,
      data: error.response ? error.response.data : null
    };
  }
}

// Run the verification
console.log('Starting block hash verification...');
console.log('=================================');

verifyBlockHash()
  .then(result => {
    console.log('\nVerification result:');
    console.log('===================');
    if (result.success) {
      console.log('✅ Verification successful!');
    } else {
      console.log('❌ Verification failed:', result.message || result.error);
    }
  })
  .catch(error => {
    console.error('\nUnexpected error:');
    console.error('=================');
    console.error(error);
  }); 