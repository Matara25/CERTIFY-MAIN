# Block Hash Verification Tools

This repository contains tools to verify Ethereum block hashes using Etherscan's API.

## Prerequisites

- Node.js (for the JavaScript verification scripts)
- An Etherscan API key (get one for free at https://etherscan.io/apis)

## Available Tools

### 1. JavaScript Verification Scripts

#### verify_blockhash.js
A simple Node.js script that verifies a block hash using Etherscan's API.

To use:
1. Install dependencies: `npm install axios`
2. Edit the script to add your Etherscan API key
3. Run: `node verify_blockhash.js`

#### verify_transaction.js
A more comprehensive script that can verify a block hash and check if it contains a specific transaction.

To use:
1. Install dependencies: `npm install axios`
2. Edit the script to add your Etherscan API key
3. Optionally, add a transaction hash to verify
4. Run: `node verify_transaction.js`

### 2. HTML Verification Tool

#### verify_blockhash.html
A browser-based tool with a user-friendly interface for verifying block hashes.

To use:
1. Open the HTML file in a web browser
2. Enter your Etherscan API key
3. Click "Verify Block Hash"

## Verifying the Block Hash: 0x8123d80f64f2ff5a752d2b296d24ccf0e7adca4c1f10540a115ec952fd42a550

To verify this specific block hash:

1. Use the HTML tool by opening `verify_blockhash.html` in your browser
2. Enter your Etherscan API key
3. The block hash is already pre-filled
4. Click "Verify Block Hash"

Or use the Node.js script:

1. Edit `verify_blockhash.js` to add your Etherscan API key
2. Run `node verify_blockhash.js`

## Understanding the Results

- If the block is found, you'll see details including the block number, timestamp, and number of transactions
- If the block is not found, it may be on a different network (testnet, private network) or may not exist

## Troubleshooting

- **API Key Issues**: Make sure your Etherscan API key is valid and has not exceeded its rate limit
- **Block Not Found**: The block hash might be from a different network (testnet, private network) or might not exist
- **Network Issues**: Check your internet connection if you're having trouble connecting to Etherscan's API

## Additional Resources

- [Etherscan API Documentation](https://docs.etherscan.io/)
- [Ethereum Block Explorer](https://etherscan.io/)
- [Understanding Ethereum Block Hashes](https://ethereum.org/en/developers/docs/blocks/) 