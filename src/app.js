// src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: Check environment variables for development only
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('- JWT_SECRET exist:', !!process.env.JWT_SECRET);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint before DB connection
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running',
        env: {
            port: process.env.PORT,
            nodeEnv: process.env.NODE_ENV,
            hasMongoUri: !!process.env.MONGODB_URI
        }
    });
});

// Database connection
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s
            socketTimeoutMS: 45000, // Close sockets after 45s
        });
        
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`👤 Host: ${mongoose.connection.host}`);
        
        // Connection events
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Full error:', err);
        
        // Graceful shutdown
        process.exit(1);
    }
};

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'AIleana Payments & Calls API',
        version: '1.0.0',
        database: statusMap[dbStatus] || 'unknown',
        uptime: process.uptime()
    });
});

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
    res.json({
        message: 'AIleana API Documentation',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile'
            },
            wallet: {
                create: 'POST /api/wallet/create',
                get: 'GET /api/wallet',
                deposit: 'POST /api/wallet/deposit',
                verifyDeposit: 'POST /api/wallet/verify-deposit',
                transactions: 'GET /api/wallet/transactions',
                validatePin: 'POST /api/wallet/validate-pin'
            },
            calls: {
                initiate: 'POST /api/calls/initiate',
                accept: 'POST /api/calls/accept',
                reject: 'POST /api/calls/reject',
                end: 'POST /api/calls/end',
                history: 'GET /api/calls/history',
                signal: 'POST /api/calls/signal'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err.toString()
        })
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to database first
        await connectDB();
        
        // Then start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`🩺 Health check: http://localhost:${PORT}/health`);
            console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

// Start the application
startServer();

module.exports = app;