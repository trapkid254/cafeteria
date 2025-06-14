const express = require('express');
const cors = require('cors');
const { initiateSTKPush, handleCallback } = require('./mpesa');

const app = express();
const port = 3000;

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// M-Pesa routes
app.post('/api/mpesa/initiate', async (req, res) => {
    try {
        console.log('Received payment request:', req.body);
        const { phoneNumber, amount, orderId } = req.body;
        
        if (!phoneNumber || !amount || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phoneNumber, amount, or orderId'
            });
        }

        console.log('Initiating M-Pesa payment:', { phoneNumber, amount, orderId });
        
        const result = await initiateSTKPush(phoneNumber, amount, orderId);
        console.log('M-Pesa initiation result:', result);
        
        return res.json(result);
    } catch (error) {
        console.error('Error in M-Pesa initiation:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate M-Pesa payment'
        });
    }
});

app.post('/api/mpesa/callback', async (req, res) => {
    try {
        const result = await handleCallback(req, res);
        return result;
    } catch (error) {
        console.error('Error in M-Pesa callback:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing M-Pesa callback'
        });
    }
});

// Payment status endpoint
app.get('/api/mpesa/status/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        // TODO: Implement actual status check from database
        return res.json({
            status: 'pending',
            message: 'Payment status check not implemented'
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
}); 