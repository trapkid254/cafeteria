const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
const corsOptions = {
  origin: [
    "https://your-github-username.github.io/your-public-repo", // GitHub Pages URL
    "https://your-admin-site.netlify.app"                      // Netlify URL
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
// app.use(express.static('public'));
// app.use('/admin', express.static('admin'));

// M-Pesa Configuration
const MPESA_CONFIG = {
    consumerKey: '054TZRXJNbDmPjhJBD8fVnJGhqVc3aI8aicf8USfapFfqEBO',
    consumerSecret: 'e7FmKAQqMmyjT0bGP7tOEpfnvn0chC6fuMsmilF8vJtoi3QPNMnGEjChJybQnCbt',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: '174379',
    env: 'sandbox'
};

// Generate timestamp
function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

// Generate password
function generatePassword() {
    const timestamp = getTimestamp();
    const str = MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp;
    return Buffer.from(str).toString('base64');
}

// Get access token
async function getAccessToken() {
    try {
        const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
}

// Initiate STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount, orderId } = req.body;
        
        // Validate input
        if (!phoneNumber || !amount || !orderId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Get access token
        const accessToken = await getAccessToken();
        
        // Prepare STK Push request
        const timestamp = getTimestamp();
        const password = generatePassword();
        
        const requestBody = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount),
            PartyA: phoneNumber,
            PartyB: MPESA_CONFIG.shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: "https://5456-41-204-187-5.ngrok-free.app/api/mpesa/callback", // ngrok callback URL
            AccountReference: "Atikas Cafe",
            TransactionDesc: `Payment for order ${orderId}`
        };

        // Make STK Push request
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('STK Push Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to initiate payment',
            details: error.response?.data || error.message
        });
    }
});

// Check M-Pesa payment status
app.get('/api/mpesa/status/:checkoutRequestId', async (req, res) => {
    try {
        const { checkoutRequestId } = req.params;
        
        // Get access token
        const accessToken = await getAccessToken();
        
        // Prepare request body
        const requestBody = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: generatePassword(),
            Timestamp: getTimestamp(),
            CheckoutRequestID: checkoutRequestId
        };

        // Make request to check status
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Payment Status Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Payment Status Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to check payment status',
            details: error.response?.data || error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});