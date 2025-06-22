import React from 'react';

const ULRGenerator = ({ reportData }) => {
    const generateULR = (year, createdAt) => {
        // Common prefix
        const prefix = 'TC8749';
        
        // Get last 2 digits of year
        const yearSuffix = year.toString().slice(-2);
        
        // Generate sequence number from timestamp
        const timestamp = new Date(createdAt).getTime();
        const sequenceNumber = Math.floor(timestamp / 1000); // Convert to seconds
        
        // Pad sequence number to 9 digits
        const paddedSequence = sequenceNumber.toString().slice(-9).padStart(9, '0');
        
        const suffix = 'F'
        
        return `${prefix}${yearSuffix}${paddedSequence}${suffix}`;
    };

    const currentYear = new Date().getFullYear();
    // Use createdAt from reportData, fallback to current timestamp if not provided
    const createdAt = reportData?.createdAt || new Date().toISOString();
    return generateULR(currentYear, createdAt);
};

export default ULRGenerator;
