/**
 * JavaScript USSD Push Implementation for Ghion Finances
 * 
 * This script provides a way to test Ghion USSD push functionality
 * without using the SDK. It implements the authentication and API calls
 * using only Node.js built-in modules.
 * 
 * Prerequisites:
 * 1. Node.js installed
 * 2. Get your API credentials from https://ghion.financial
 * 3. Have a phone number registered with YaYaWallet for testing
 * 
 * IMPORTANT: For live testing with real USSD push payments:
 * - Complete KYC verification on Ghion dashboard
 * - Request to go live in production mode
 * - User must have sufficient balance in YaYaWallet account
 * 
 * See README.md for complete API request/response formats and testing requirements.
 */

const crypto = require('crypto');
require('dotenv').config();

// Configuration from environment variables
const config = {
  apiKey: process.env.GHION_API_KEY,
  apiSecret: process.env.GHION_API_SECRET, 
  passphrase: process.env.GHION_API_PASSPHRASE,
  baseUrl: 'https://ghion.financial/api/v1',
  checkoutBaseUrl: 'https://app.ghion.financial/api/v1',
};

// Test phone number from environment variable (must be registered with YaYaWallet)
const testPhoneNumber = process.env.TEST_PHONE_NUMBER;

/**
 * Generate HMAC-SHA256 signature for API authentication
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API path including /api/v1 prefix
 * @param {string} body - Request body as string
 * @param {string} secret - API secret key
 * @returns {string} Base64-encoded signature
 */
function generateSignature(timestamp, method, path, body, secret) {
  const message = `${timestamp}${method}${path}${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

/**
 * Get current Unix timestamp in seconds
 * @returns {number} Current timestamp
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Make authenticated API request
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {object} data - Request body data
 * @param {string} customBaseUrl - Custom base URL (optional)
 * @param {boolean} skipAuth - Skip authentication (optional)
 * @returns {Promise<object>} API response
 */
async function apiRequest(method, path, data = null, customBaseUrl = null, skipAuth = false) {
  const body = data ? JSON.stringify(data) : '';
  const baseUrl = customBaseUrl || config.baseUrl;
  const url = `${baseUrl}${path}`;
  const parsedUrl = new URL(url);
  const fullPath = parsedUrl.pathname + parsedUrl.search;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const timestamp = getCurrentTimestamp();
    // For GET requests, use only pathname for signature (exclude query string)
    const signaturePath = method === 'GET' ? parsedUrl.pathname : fullPath;
    const signature = generateSignature(timestamp, method, signaturePath, body, config.apiSecret);
    
    headers['X-Ghion-Key'] = config.apiKey;
    headers['X-Ghion-Timestamp'] = String(timestamp);
    headers['X-Ghion-Signature'] = signature;
    headers['X-Ghion-Passphrase'] = config.passphrase;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    });

    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid response from API: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const errorMessage = json.error?.message || `API ${response.status}`;
      throw new Error(errorMessage);
    }

    return json;
  } catch (error) {
    if (error.message.includes('fetch failed')) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Initialize a new payment session
 * 
 * Request Format:
 * {
 *   amount: number,
 *   currency: string (default: "ETB"),
 *   reference: string,
 *   description: string (optional),
 *   webhook_url: string (optional),
 *   return_url: string (optional),
 *   cancel_url: string (optional),
 *   metadata: object (optional)
 * }
 * 
 * Response Format:
 * {
 *   id: string,
 *   amount: number,
 *   currency: string,
 *   reference: string,
 *   status: string,
 *   available_channels: array,
 *   created_at: string
 * }
 * 
 * @param {object} request - Payment initialization parameters
 * @returns {Promise<object>} Payment initialization response
 */
async function initializePayment(request) {
  const body = {
    amount: request.amount,
    currency: request.currency || 'ETB',
    reference: request.reference,
    description: request.description || 'Payment',
    webhook_url: request.webhookUrl,
    return_url: request.returnUrl,
    cancel_url: request.cancelUrl,
    metadata: request.metadata,
  };

  return apiRequest('POST', '/checkout/initialize', body);
}

/**
 * Submit payment with YaYaWallet (USSD Push)
 * 
 * Request Format:
 * {
 *   phone_number: string
 * }
 * 
 * Response Format:
 * {
 *   status: string,
 *   transaction_id: string,
 *   message: string,
 *   phone_number: string,
 *   channel: string
 * }
 * 
 * @param {string} paymentId - Payment session ID
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<object>} Payment submission response
 */
async function submitUSSDPayment(paymentId, phoneNumber) {
  const body = {
    phone_number: phoneNumber,
  };

  return apiRequest('POST', `/checkout/${paymentId}/pay/yayawallet`, body, config.checkoutBaseUrl);
}

/**
 * Get payment status
 * 
 * Request Parameters:
 * - paymentId (path parameter): Payment session ID
 * 
 * Response Format:
 * {
 *   id: string,
 *   amount: number,
 *   currency: string,
 *   reference: string,
 *   status: string,
 *   message: string,
 *   created_at: string,
 *   updated_at: string
 * }
 * 
 * Possible Status Values:
 * - pending: Payment initiated, awaiting user action
 * - processing: Payment is being processed
 * - completed: Payment successfully completed
 * - failed: Payment failed
 * - cancelled: Payment was cancelled by user
 * 
 * @param {string} paymentId - Payment session ID
 * @returns {Promise<object>} Payment status response
 */
async function getPaymentStatus(paymentId) {
  return apiRequest('GET', `/checkout/${paymentId}`);
}

/**
 * Run the USSD push test
 */
async function runUSSDPushTest() {
  console.log('=== Ghion USSD Push Test (JavaScript) ===\n');
  
  // Validate configuration
  if (!config.apiKey || !config.apiSecret || !config.passphrase) {
    console.error('ERROR: Please configure your API credentials in .env file');
    console.log('Copy .env.example to .env and fill in your credentials');
    console.log('Get credentials from: https://ghion.financial');
    process.exit(1);
  }

  if (!testPhoneNumber) {
    console.error('ERROR: Please configure TEST_PHONE_NUMBER in .env file');
    process.exit(1);
  }

  let paymentId;

  try {
    // Step 1: Initialize Payment
    console.log('Step 1: Initializing payment...');
    const initRequest = {
      amount: 10,
      currency: 'ETB',
      reference: `test_${Date.now()}`,
      description: 'USSD Push Integration Test',
    };
    console.log('Request:', JSON.stringify(initRequest, null, 2));
    console.log();
    
    const initResponse = await initializePayment(initRequest);

    paymentId = initResponse.id;
    console.log(`Payment initialized successfully`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Available channels: ${initResponse.available_channels?.map(c => c.name).join(', ') || 'N/A'}`);
    console.log(`\nFull API Response:`);
    console.log(JSON.stringify(initResponse, null, 2));
    console.log();

    // Step 2: Submit USSD Push Payment with YaYaWallet
    console.log('Step 2: Submitting USSD push payment with YaYaWallet...');
    console.log(`   Phone: ${testPhoneNumber}`);
    
    const submitRequest = {
      phone_number: testPhoneNumber,
    };
    console.log('Request:', JSON.stringify(submitRequest, null, 2));
    console.log();
    
    const submitResponse = await submitUSSDPayment(paymentId, testPhoneNumber);

    console.log(`USSD push submitted successfully`);
    console.log(`   Status: ${submitResponse.status}`);
    console.log(`   Transaction ID: ${submitResponse.transaction_id}`);
    console.log(`   Message: ${submitResponse.message}`);
    console.log(`\nFull API Response:`);
    console.log(JSON.stringify(submitResponse, null, 2));
    console.log();

    // Step 3: Check Payment Status
    console.log('Step 3: Checking payment status...');
    console.log(`Payment ID: ${paymentId}`);
    console.log('Request: GET /checkout/' + paymentId);
    console.log();
    
    const statusResponse = await getPaymentStatus(paymentId);
    
    console.log(`Payment status retrieved`);
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Amount: ${statusResponse.amount} ${statusResponse.currency}`);
    console.log(`   Reference: ${statusResponse.reference}`);
    console.log(`\nFull API Response:`);
    console.log(JSON.stringify(statusResponse, null, 2));
    console.log();

    // Success Summary
    console.log('=== USSD Push Test Completed Successfully ===');
    console.log('Your JavaScript implementation is working correctly!');
    console.log('\nRequest and Response formats shown above for documentation purposes.');
    console.log('See README.md for complete API reference and testing requirements.');
    console.log('\nNext steps:');
    console.log('- Check your phone for YaYaWallet USSD prompt');
    console.log('- Approve the payment to complete the transaction');
    console.log('- Use this payment ID for further testing:', paymentId);

  } catch (error) {
    console.error('Test Failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('User does not exist')) {
      console.log('\n Tip: The phone number must be registered with YaYaWallet');
      console.log('   Use a different phone number or register with YaYaWallet first');
    } else if (error.message.includes('authentication')) {
      console.log('\n Tip: Check your API credentials are correct');
    } else if (error.message.includes('401')) {
      console.log('\n Tip: Your API credentials may be invalid or expired');
    }
    
    process.exit(1);
  }
}

// Run the test
console.log('Starting Ghion USSD push integration test (JavaScript)...\n');
runUSSDPushTest();
