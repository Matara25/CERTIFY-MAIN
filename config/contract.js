// Certificate Smart Contract ABI
const CERTIFICATE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "certificateAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "instituteAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "certificateAddress",
        "type": "address"
      }
    ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "certificateAddress",
        "type": "address"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Student Registry Smart Contract ABI
const STUDENT_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "studentDataString",
        "type": "string"
      }
    ],
    "name": "storeStudentData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      }
    ],
    "name": "getStudentData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "email",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "blockchainAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "studentId",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "subjects",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct StudentRegistry.StudentData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "studentAddress",
        "type": "address"
      }
    ],
    "name": "studentExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Load environment variables
require('dotenv').config();

// Contract configuration
const contractConfig = {
  certificate: {
    address: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: CERTIFICATE_ABI
  },
  studentRegistry: {
    address: process.env.STUDENT_REGISTRY_ADDRESS || process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: STUDENT_REGISTRY_ABI
  }
};

// Validate contract configuration
if (!contractConfig.certificate.address) {
  console.error('Warning: CONTRACT_ADDRESS not found in environment variables');
}

if (!contractConfig.studentRegistry.address) {
  console.error('Warning: STUDENT_REGISTRY_ADDRESS not found in environment variables');
}

// Validate ABIs
if (!contractConfig.certificate.abi || !Array.isArray(contractConfig.certificate.abi)) {
  console.error('Warning: Certificate ABI is invalid');
}

if (!contractConfig.studentRegistry.abi || !Array.isArray(contractConfig.studentRegistry.abi)) {
  console.error('Warning: Student Registry ABI is invalid');
}

// Log contract configuration for debugging
console.log('Certificate contract address:', contractConfig.certificate.address);
console.log('Certificate ABI length:', contractConfig.certificate.abi.length);
console.log('Student Registry contract address:', contractConfig.studentRegistry.address);
console.log('Student Registry ABI length:', contractConfig.studentRegistry.abi.length);

module.exports = contractConfig; 