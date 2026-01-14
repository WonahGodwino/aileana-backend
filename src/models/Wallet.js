// src/models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0.00,
        min: 0
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    transactionPin: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 4
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastTransactionAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Wallet', walletSchema);