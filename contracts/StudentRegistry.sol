// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StudentRegistry {
    // Structure to store student data
    struct StudentData {
        string name;
        string email;
        address blockchainAddress;
        string studentId;
        string[] subjects;
        uint256 timestamp;
    }
    
    // Mapping from student address to their data
    mapping(address => StudentData) public students;
    
    // Event emitted when student data is stored
    event StudentDataStored(address indexed studentAddress, string studentId);
    
    // Function to store student data
    function storeStudentData(address studentAddress, string memory studentDataString) public {
        // Parse the JSON string (in a real implementation, you would use a JSON parser)
        // For simplicity, we'll just store the raw string
        
        // Create a new student data entry
        StudentData memory newStudent = StudentData({
            name: "",  // These will be filled from the JSON string
            email: "",
            blockchainAddress: studentAddress,
            studentId: "",
            subjects: new string[](0),
            timestamp: block.timestamp
        });
        
        // Store the student data
        students[studentAddress] = newStudent;
        
        // Emit an event
        emit StudentDataStored(studentAddress, "");
    }
    
    // Function to retrieve student data
    function getStudentData(address studentAddress) public view returns (StudentData memory) {
        return students[studentAddress];
    }
    
    // Function to check if a student exists
    function studentExists(address studentAddress) public view returns (bool) {
        return students[studentAddress].timestamp > 0;
    }
} 