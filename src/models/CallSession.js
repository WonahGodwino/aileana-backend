// src/models/CallSession.js
const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio'
    },
    status: {
        type: String,
        enum: ['initiated', 'ringing', 'ongoing', 'completed', 'missed', 'rejected', 'failed'],
        default: 'initiated'
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    chargePerMinute: {
        type: Number,
        default: 50 // Default charge in Naira per minute
    },
    totalCost: {
        type: Number,
        default: 0
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    signalingData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
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

module.exports = mongoose.model('CallSession', callSessionSchema);