// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {
    struct CertificateData {
        address studentAddress;
        address instituteAddress;
        string courseName;
        uint256 duration;
        bool isValid;
        uint256 timestamp;
    }

    mapping(address => CertificateData) public certificates;
    address public owner;

    event CertificateIssued(address indexed certificateAddress, address indexed studentAddress);
    event CertificateRevoked(address indexed certificateAddress);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function issueCertificate(
        address certificateAddress,
        address studentAddress,
        string memory courseName,
        uint256 duration
    ) public onlyOwner {
        require(certificates[certificateAddress].timestamp == 0, "Certificate already exists");
        
        certificates[certificateAddress] = CertificateData({
            studentAddress: studentAddress,
            instituteAddress: msg.sender,
            courseName: courseName,
            duration: duration,
            isValid: true,
            timestamp: block.timestamp
        });

        emit CertificateIssued(certificateAddress, studentAddress);
    }

    function revokeCertificate(address certificateAddress) public onlyOwner {
        require(certificates[certificateAddress].timestamp != 0, "Certificate does not exist");
        certificates[certificateAddress].isValid = false;
        emit CertificateRevoked(certificateAddress);
    }

    function verifyCertificate(address certificateAddress) public view returns (bool) {
        return certificates[certificateAddress].isValid;
    }

    function getCertificateData(address certificateAddress) public view returns (
        address studentAddress,
        address instituteAddress,
        string memory courseName,
        uint256 duration,
        bool isValid,
        uint256 timestamp
    ) {
        CertificateData memory cert = certificates[certificateAddress];
        return (
            cert.studentAddress,
            cert.instituteAddress,
            cert.courseName,
            cert.duration,
            cert.isValid,
            cert.timestamp
        );
    }
} 