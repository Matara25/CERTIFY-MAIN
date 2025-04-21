#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Install axios if not already installed
echo "Installing axios dependency..."
npm install axios

# Run the verification script
echo "Running block hash verification..."
node verify_block_terminal.js

echo "Verification complete." 