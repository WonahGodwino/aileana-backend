// src/controllers/callController.js
const callService = require('../services/callService');

const callController = {
    async initiateCall(req, res) {
        try {
            const callerId = req.user._id;
            const { receiverId, callType = 'audio' } = req.body;

            const result = await callService.initiateCall(callerId, receiverId, callType);

            res.json({
                success: true,
                message: result.message,
                data: {
                    sessionId: result.sessionId,
                    callSession: result.callSession
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async acceptCall(req, res) {
        try {
            const receiverId = req.user._id;
            const { sessionId } = req.body;

            const result = await callService.acceptCall(sessionId, receiverId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            res.json({
                success: true,
                message: result.message,
                data: {
                    callSession: result.callSession
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async rejectCall(req, res) {
        try {
            const receiverId = req.user._id;
            const { sessionId } = req.body;

            const result = await callService.rejectCall(sessionId, receiverId);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async endCall(req, res) {
        try {
            const userId = req.user._id;
            const { sessionId } = req.body;

            const result = await callService.endCall(sessionId, userId);

            res.json({
                success: true,
                message: result.message,
                data: {
                    callSession: result.callSession
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async getCallHistory(req, res) {
        try {
            const userId = req.user._id;
            const { page = 1, limit = 20 } = req.query;

            const result = await callService.getCallHistory(userId, parseInt(page), parseInt(limit));

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

    async handleSignaling(req, res) {
        try {
            const userId = req.user._id;
            const { sessionId, signalData } = req.body;

            const result = await callService.handleSignaling(sessionId, userId, signalData);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = callController;