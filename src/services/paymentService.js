// src/services/paymentService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MonnifyService {
    constructor() {
        this.baseURL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com/api/v1';
        this.apiKey = process.env.MONNIFY_API_KEY || 'mock_api_key';
        this.secretKey = process.env.MONNIFY_SECRET_KEY || 'mock_secret_key';
        this.contractCode = process.env.MONNIFY_CONTRACT_CODE || 'mock_contract_code';
    }

    async authenticate() {
        // Mock authentication - in production this would make actual API call
        return {
            accessToken: 'mock_access_token_' + Date.now(),
            expiresIn: 3600
        };
    }

    async initializeTransaction(transactionData) {
        const {
            amount,
            customerEmail,
            customerName,
            paymentDescription,
            transactionReference
        } = transactionData;

        // Mock response - simulate Monnify's response
        return {
            success: true,
            message: 'Transaction initialized successfully',
            responseBody: {
                transactionReference,
                paymentReference: uuidv4(),
                checkoutUrl: `${this.baseURL}/mock-checkout/${transactionReference}`,
                amount: amount,
                status: 'PENDING',
                createdOn: new Date().toISOString()
            }
        };
    }

    async verifyTransaction(transactionReference) {
        // Mock verification
        const statuses = ['PAID', 'PENDING', 'FAILED'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            success: true,
            message: 'Transaction verified',
            responseBody: {
                transactionReference,
                paymentReference: uuidv4(),
                amountPaid: 5000.00,
                totalPayable: 5000.00,
                settlementAmount: 4850.00,
                paidOn: new Date().toISOString(),
                paymentStatus: randomStatus,
                paymentDescription: 'Mock payment',
                currency: 'NGN',
                paymentMethod: 'CARD'
            }
        };
    }

    async refundTransaction(transactionReference, amount, reason) {
        // Mock refund
        return {
            success: true,
            message: 'Refund initiated successfully',
            responseBody: {
                transactionReference,
                refundReference: uuidv4(),
                amount: amount,
                refundAmount: amount,
                refundStatus: 'PENDING',
                createdOn: new Date().toISOString(),
                reason: reason
            }
        };
    }
}

module.exports = new MonnifyService();