// src/routes/index.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Import controllers
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
const callController = require('../controllers/callController');

// Auth routes (no authentication required)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Protected routes
router.use(authenticate);

// Profile
router.get('/auth/profile', authController.getProfile);

// Wallet routes
router.post('/wallet/create', walletController.createWallet);
router.get('/wallet', walletController.getWallet);
router.post('/wallet/deposit', walletController.deposit);
router.post('/wallet/verify-deposit', walletController.verifyDeposit);
router.get('/wallet/transactions', walletController.getTransactionHistory);
router.post('/wallet/validate-pin', walletController.validatePin);

// Call routes
router.post('/calls/initiate', callController.initiateCall);
router.post('/calls/accept', callController.acceptCall);
router.post('/calls/reject', callController.rejectCall);
router.post('/calls/end', callController.endCall);
router.get('/calls/history', callController.getCallHistory);
router.post('/calls/signal', callController.handleSignaling);

// Admin routes (example)
router.get('/admin/users', authorize('admin'), (req, res) => {
    res.json({ message: 'Admin access granted' });
});

module.exports = router;