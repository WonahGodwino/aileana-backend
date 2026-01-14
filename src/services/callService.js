// src/services/callService.js
const CallSession = require('../models/CallSession');
const walletService = require('./walletService');
const { v4: uuidv4 } = require('uuid');

class CallService {
    async initiateCall(callerId, receiverId, callType = 'audio') {
        try {
            // Check if receiver is available (in reality, check presence)
            // This would integrate with a real-time service like Socket.io
            
            const sessionId = `CALL_${Date.now()}_${uuidv4().slice(0, 8)}`;
            
            const callSession = new CallSession({
                sessionId,
                callerId,
                receiverId,
                type: callType,
                status: 'initiated',
                chargePerMinute: callType === 'video' ? 100 : 50, // Naira per minute
                signalingData: {
                    callerSignal: {},
                    receiverSignal: {},
                    iceCandidates: []
                }
            });

            await callSession.save();

            // In reality, send notification to receiver via WebSocket
            this.notifyReceiver(receiverId, {
                type: 'incoming_call',
                sessionId,
                callerId,
                callType
            });

            return {
                success: true,
                sessionId,
                callSession,
                message: 'Call initiated. Waiting for receiver...'
            };
        } catch (error) {
            throw error;
        }
    }

    async acceptCall(sessionId, receiverId) {
        const session = await CallSession.startSession();
        session.startTransaction();

        try {
            const callSession = await CallSession.findOne({ 
                sessionId, 
                receiverId,
                status: 'initiated'
            }).session(session);

            if (!callSession) {
                throw new Error('Call session not found or not eligible for acceptance');
            }

            // Check if caller has sufficient balance for at least 1 minute
            const minCharge = callSession.chargePerMinute / 60; // Charge per second
            
            try {
                // Reserve amount for call (would be more sophisticated in production)
                await walletService.chargeForCall(
                    callSession.callerId, 
                    minCharge * 60, // Charge for 1 minute upfront
                    sessionId
                );

                callSession.status = 'ringing';
                callSession.startedAt = new Date();
                await callSession.save({ session });

                // Create transaction record for call
                const transactionReference = `CALL_START_${Date.now()}_${uuidv4().slice(0, 8)}`;
                // This would link to the wallet transaction

                await session.commitTransaction();

                // In reality, send signaling data to both parties via WebSocket
                this.notifyCaller(callSession.callerId, {
                    type: 'call_accepted',
                    sessionId,
                    signalingData: callSession.signalingData
                });

                return {
                    success: true,
                    callSession,
                    message: 'Call accepted and started'
                };
            } catch (walletError) {
                // Handle insufficient balance
                callSession.status = 'failed';
                callSession.endedAt = new Date();
                await callSession.save({ session });
                await session.commitTransaction();

                this.notifyCaller(callSession.callerId, {
                    type: 'call_failed',
                    sessionId,
                    reason: 'insufficient_balance'
                });

                return {
                    success: false,
                    message: 'Insufficient balance to start call'
                };
            }
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async endCall(sessionId, userId) {
        const session = await CallSession.startSession();
        session.startTransaction();

        try {
            const callSession = await CallSession.findOne({ 
                sessionId,
                $or: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            }).session(session);

            if (!callSession) {
                throw new Error('Call session not found');
            }

            callSession.status = 'completed';
            callSession.endedAt = new Date();
            
            // Calculate duration and cost
            const durationSeconds = Math.floor((callSession.endedAt - callSession.startedAt) / 1000);
            callSession.duration = durationSeconds;
            
            // Calculate cost (per minute billing, minimum 1 minute)
            const minutes = Math.max(Math.ceil(durationSeconds / 60), 1);
            callSession.totalCost = minutes * callSession.chargePerMinute;

            // If call lasted more than initial 1 minute, charge additional
            if (minutes > 1) {
                const additionalMinutes = minutes - 1;
                const additionalCharge = additionalMinutes * callSession.chargePerMinute;
                
                await walletService.chargeForCall(
                    callSession.callerId,
                    additionalCharge,
                    sessionId
                );
            }

            await callSession.save({ session });
            await session.commitTransaction();

            // Notify both parties
            this.notifyCaller(callSession.callerId, {
                type: 'call_ended',
                sessionId,
                duration: durationSeconds,
                totalCost: callSession.totalCost
            });

            this.notifyReceiver(callSession.receiverId, {
                type: 'call_ended',
                sessionId,
                duration: durationSeconds
            });

            return {
                success: true,
                callSession,
                message: 'Call ended successfully'
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async rejectCall(sessionId, receiverId) {
        try {
            const callSession = await CallSession.findOne({ 
                sessionId, 
                receiverId 
            });

            if (!callSession) {
                throw new Error('Call session not found');
            }

            callSession.status = 'rejected';
            callSession.endedAt = new Date();
            await callSession.save();

            // Notify caller
            this.notifyCaller(callSession.callerId, {
                type: 'call_rejected',
                sessionId
            });

            return {
                success: true,
                message: 'Call rejected'
            };
        } catch (error) {
            throw error;
        }
    }

    async getCallHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const calls = await CallSession.find({
                $or: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('callerId', 'fullName email phoneNumber')
            .populate('receiverId', 'fullName email phoneNumber');

            const total = await CallSession.countDocuments({
                $or: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            });

            return {
                calls,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Mock WebSocket notification methods
    notifyReceiver(receiverId, data) {
        console.log(`[WebSocket] Notifying receiver ${receiverId}:`, data);
        // In reality: socket.to(receiverId).emit('call', data);
    }

    notifyCaller(callerId, data) {
        console.log(`[WebSocket] Notifying caller ${callerId}:`, data);
        // In reality: socket.to(callerId).emit('call', data);
    }

    // Signaling methods for WebRTC (mocked)
    async handleSignaling(sessionId, userId, signalData) {
        try {
            const callSession = await CallSession.findOne({ sessionId });
            if (!callSession) {
                throw new Error('Call session not found');
            }

            // Store signaling data
            if (userId.toString() === callSession.callerId.toString()) {
                callSession.signalingData.callerSignal = signalData;
            } else {
                callSession.signalingData.receiverSignal = signalData;
            }

            await callSession.save();

            // Forward signal to other participant
            const targetUserId = userId.toString() === callSession.callerId.toString() 
                ? callSession.receiverId 
                : callSession.callerId;

            this.forwardSignal(targetUserId, {
                type: 'signal',
                sessionId,
                signalData
            });

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    forwardSignal(userId, data) {
        console.log(`[WebSocket] Forwarding signal to ${userId}:`, data.type);
        // In reality: socket.to(userId).emit('signal', data);
    }
}

module.exports = new CallService();