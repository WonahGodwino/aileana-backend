// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    async register(req, res) {
        try {
            const { email, password, phoneNumber, fullName } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { phoneNumber }] 
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or phone already exists'
                });
            }

            // Create user
            const user = new User({
                email,
                password,
                phoneNumber,
                fullName
            });

            await user.save();

            // Generate JWT
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY }
            );

            // Remove password from response
            user.password = undefined;

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error registering user',
                error: error.message
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY }
            );

            // Remove password from response
            user.password = undefined;

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error logging in',
                error: error.message
            });
        }
    },

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id).select('-password');
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching profile',
                error: error.message
            });
        }
    }
};

module.exports = authController;