// src/services/walletService.js
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const paymentService = require('./paymentService');

class WalletService {
    async createWallet(userId, transactionPin) {
        try {
            const existingWallet = await Wallet.findOne({ userId });
            if (existingWallet) {
                throw new Error('Wallet already exists for this user');
            }

            const wallet = new Wallet({
                userId,
                transactionPin,
                balance: 0.00
            });

            await wallet.save();
            return wallet;
        } catch (error) {
            throw error;
        }
    }

    async getWallet(userId) {
        try {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            return wallet;
        } catch (error) {
            throw error;
        }
    }

    async deposit(userId, amount, paymentMethod = 'monnify') {
        const session = await Wallet.startSession();
        session.startTransaction();

        try {
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            // Initialize payment with Monnify
            const transactionReference = `DEP_${Date.now()}_${uuidv4().slice(0, 8)}`;
            const paymentResult = await paymentService.initializeTransaction({
                amount,
                customerEmail: 'user@example.com', // In reality, get from user
                customerName: 'User', // In reality, get from user
                paymentDescription: `Wallet deposit of ${amount} NGN`,
                transactionReference
            });

            // Create transaction record
            const transaction = new Transaction({
                userId,
                walletId: wallet._id,
                type: 'credit',
                category: 'deposit',
                amount,
                status: 'pending',
                reference: transactionReference,
                paymentReference: paymentResult.responseBody.paymentReference,
                description: `Wallet deposit via ${paymentMethod}`,
                metadata: {
                    paymentMethod,
                    checkoutUrl: paymentResult.responseBody.checkoutUrl
                }
            });

            await transaction.save({ session });
            await session.commitTransaction();
            
            return {
                wallet,
                transaction,
                paymentDetails: paymentResult.responseBody
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async verifyAndCompleteDeposit(transactionReference) {
        const session = await Wallet.startSession();
        session.startTransaction();

        try {
            // Verify payment with Monnify
            const verification = await paymentService.verifyTransaction(transactionReference);
            
            if (verification.responseBody.paymentStatus !== 'PAID') {
                throw new Error('Payment not completed');
            }

            // Find transaction
            const transaction = await Transaction.findOne({ 
                reference: transactionReference 
            }).session(session);

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Update wallet balance
            const wallet = await Wallet.findById(transaction.walletId).session(session);
            wallet.balance += verification.responseBody.amountPaid;
            wallet.lastTransactionAt = new Date();
            await wallet.save({ session });

            // Update transaction
            transaction.status = 'completed';
            transaction.metadata.verificationData = verification.responseBody;
            transaction.completedAt = new Date();
            await transaction.save({ session });

            await session.commitTransaction();

            return {
                success: true,
                wallet,
                transaction,
                verification: verification.responseBody
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async chargeForCall(userId, amount, callSessionId) {
        const session = await Wallet.startSession();
        session.startTransaction();

        try {
            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (wallet.balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Deduct amount
            wallet.balance -= amount;
            wallet.lastTransactionAt = new Date();
            await wallet.save({ session });

            // Create transaction record
            const transactionReference = `CALL_${Date.now()}_${uuidv4().slice(0, 8)}`;
            const transaction = new Transaction({
                userId,
                walletId: wallet._id,
                type: 'debit',
                category: 'call_payment',
                amount,
                status: 'completed',
                reference: transactionReference,
                description: `Call charge for session ${callSessionId}`,
                metadata: {
                    callSessionId
                },
                completedAt: new Date()
            });

            await transaction.save({ session });
            await session.commitTransaction();

            return {
                wallet,
                transaction
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getTransactionHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const transactions = await Transaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('recipientId', 'email fullName');

            const total = await Transaction.countDocuments({ userId });

            return {
                transactions,
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

    async validateTransactionPin(userId, pin) {
        try {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            return wallet.transactionPin === pin;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new WalletService();