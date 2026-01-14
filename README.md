API Documentation (Quick Reference)
Authentication
POST /api/auth/register - Register new user

POST /api/auth/login - Login user

GET /api/auth/profile - Get user profile (protected)

Wallet Management
POST /api/wallet/create - Create wallet with transaction PIN

GET /api/wallet - Get wallet balance

POST /api/wallet/deposit - Initiate deposit

POST /api/wallet/verify-deposit - Verify deposit completion

GET /api/wallet/transactions - Get transaction history

POST /api/wallet/validate-pin - Validate transaction PIN

Call Management
POST /api/calls/initiate - Initiate a call

POST /api/calls/accept - Accept incoming call

POST /api/calls/reject - Reject incoming call

POST /api/calls/end - End ongoing call

GET /api/calls/history - Get call history

POST /api/calls/signal - Handle WebRTC signaling (mocked)

Key Features Implemented
Payment Flow
Wallet Creation: Secure wallet with transaction PIN

Deposit Processing: Integration with Monnify (mocked)

Transaction Tracking: Complete audit trail for all financial transactions

Balance Management: Real-time balance updates with transaction locks

Call Flow
Call Initiation: Create call session with unique ID

Balance Verification: Check caller's balance before allowing call

Call Acceptance/Rejection: Receiver can accept or reject calls

Real-time Billing: Per-minute billing with minimum charge

Call Termination: Automatic cost calculation on call end

Signaling Support: Mocked WebRTC signaling endpoints

Security Features
JWT Authentication: Secure token-based authentication

Transaction PIN: Additional layer for financial operations

Input Validation: Basic validation on all endpoints

Rate Limiting: Protection against brute force attacks

CORS Configuration: Configurable CORS policies

Helmet.js: Security headers

Architecture
MVC Pattern: Clear separation of concerns

Service Layer: Business logic separated from controllers

Database Transactions: ACID compliance for financial operations

Error Handling: Comprehensive error handling throughout

Logging: Basic logging for debugging

3. Setup Instructions
Clone and install dependencies:

npm install
npm init -y
npm install express mongoose jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit express-validator uuid axios
npm install --save-dev nodemon
npm run dev
Running the Applicatiom
# Development with auto-restart
npm run dev
# Production
npm start
# 4.Test the API:

Use Postman or curl to test endpoints

Start with registration: POST /api/auth/register

Then login: POST /api/auth/login

Use the JWT token in Authorization header for protected routes

✅ Completed (Core Requirements)
User authentication with JWT

Wallet creation and management

Payment integration (Monnify mock)

Call session management

Real-time billing logic

Database models with relationships

Basic security measures

Comprehensive error handling


⏰ Time Constraints Considerations
Simplified WebRTC: Signaling is mocked instead of full WebRTC implementation

Basic Validation: Input validation could be more comprehensive

No Real WebSockets: Used console logs instead of actual WebSocket implementation

Mocked Payment: Monnify integration is simulated

Basic Testing: No unit/integration tests due to time

Potential Improvements with More Time
Real WebSocket Integration: For actual real-time communication

Full WebRTC Implementation: With STUN/TURN servers

Comprehensive Testing: Unit, integration, and e2e tests

Advanced Security: Rate limiting per endpoint, IP blocking

Monitoring: Logging, metrics, and alerting

Deployment: Docker configuration, CI/CD pipeline

API Documentation: Swagger/OpenAPI spec

Caching: Redis for session management

Message Queue: For async payment processing

Webhook Support: For payment provider callbacks