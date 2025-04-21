const crypto = require('crypto');

/**
 * Generates a unique registration number for a certificate
 * Format: CERT-YYYYMMDD-XXXXX where XXXXX is a sequential number
 * @returns {Promise<string>} A unique registration number
 */
async function generateRegistrationNumber() {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return `CERT-${timestamp}-${random}`.toUpperCase();
}

// Generate a blockchain hash for the certificate
function generateBlockchainHash(certificateData) {
  const dataString = JSON.stringify(certificateData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Validate certificate data
function validateCertificateData(data) {
  const requiredFields = ['studentAddress', 'courseName', 'duration'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(data.studentAddress)) {
    throw new Error('Invalid Ethereum address format');
  }
  
  // Validate duration (must be a positive number)
  if (isNaN(data.duration) || data.duration <= 0) {
    throw new Error('Duration must be a positive number');
  }
  
  return true;
}

module.exports = {
  generateRegistrationNumber,
  generateBlockchainHash,
  validateCertificateData
}; 