const bcrypt = require('bcryptjs');

async function createAdminWithCredentials(username, password) {
    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        return {
            username: username,
            password: password,
            hashedPassword: hashedPassword,
            success: true
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// If script is run directly, use command line arguments
if (require.main === module) {
    const username = process.argv[2];
    const password = process.argv[3];
    
    if (!username || !password) {
        console.error('Please provide username and password as arguments');
        process.exit(1);
    }
    
    createAdminWithCredentials(username, password);
}

module.exports = createAdminWithCredentials; 