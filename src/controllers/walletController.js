// src/controllers/walletController.js
const walletService = require('../services/walletService');

const walletController = {
    async createWallet(req, res) {
        try {
            const { transactionPin } = req.body;
            const userId = req.user._id;

            const wallet = await walletService.createWallet(userId, transactionPin);

            res.status(201).json({
                success: true,
                message: 'Wallet created successfully',
                data: wallet
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async getWallet(req, res) {
        try {
            const userId = req.user._id;
            const wallet = await walletService.getWallet(userId);

            res.json({
                success: true,
                data: wallet
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    async deposit(req, res) {
        try {
            const userId = req.user._id;
            const { amount, paymentMethod } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }

            const result = await walletService.deposit(userId, amount, paymentMethod);

            res.json({
                success: true,
                message: 'Deposit initiated',
                data: {
                    wallet: result.wallet,
                    transaction: result.transaction,
                    paymentDetails: result.paymentDetails
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async verifyDeposit(req, res) {
        try {
            const { transactionReference } = req.body;

            const result = await walletService.verifyAndCompleteDeposit(transactionReference);

            res.json({
                success: true,
                message: 'Deposit verified and completed',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async getTransactionHistory(req, res) {
        try {
            const userId = req.user._id;
            const { page = 1, limit = 20 } = req.query;

            const result = await walletService.getTransactionHistory(userId, parseInt(page), parseInt(limit));

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async validatePin(req, res) {
        try {
            const userId = req.user._id;
            const { pin } = req.body;

            const isValid = await walletService.validateTransactionPin(userId, pin);

            res.json({
                success: true,
                data: { isValid }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = walletController;