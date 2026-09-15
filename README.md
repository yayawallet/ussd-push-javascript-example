# Ghion USSD Push - JavaScript Example

This example demonstrates how to implement Ghion USSD push functionality using JavaScript without the SDK. It uses only Node.js built-in modules for API authentication and requests.

## Features

- ✅ JavaScript implementation (no SDK dependencies)
- ✅ HMAC-SHA256 signature generation for API authentication
- ✅ Complete USSD push flow with YaYaWallet
- ✅ Payment initialization and status checking
- ✅ Error handling with helpful messages

## Prerequisites

1. **Node.js** - Install Node.js (version 14 or higher)
2. **API Credentials** - Get your API credentials from [https://ghion.financial](https://ghion.financial)
3. **YaYaWallet Account** - Have a phone number registered with YaYaWallet for testing

## Setup

1. Clone or navigate to this directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add your credentials:
   ```env
   GHION_API_KEY=your_api_key_here
   GHION_API_SECRET=your_api_secret_here
   GHION_API_PASSPHRASE=your_passphrase_here
   TEST_PHONE_NUMBER=0912345678
   ```

## Usage

Run the test script:
```bash
npm test
```

Or directly with Node.js:
```bash
node ussd-push.js
```

The script will automatically load environment variables from the `.env` file.

## How It Works

The script performs the following steps:

1. **Initialize Payment**: Creates a payment session with specified amount and reference
2. **Submit USSD Push**: Sends a USSD push request to the user's phone via YayaWallet
3. **Check Status**: Retrieves the current payment status

## Authentication

The implementation uses HMAC-SHA256 signatures for API authentication:

```javascript
const message = `${timestamp}${method}${path}${body}`;
const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');
```

Required headers:
- `X-Ghion-Key`: Your API key
- `X-Ghion-Timestamp`: Unix timestamp in seconds
- `X-Ghion-Signature`: HMAC-SHA256 signature
- `X-Ghion-Passphrase`: Your passphrase

## Error Handling

The script includes helpful error messages for common issues:

- **User does not exist**: Phone number not registered with YaYaWallet
- **Authentication errors**: Invalid API credentials
- **Network errors**: Connection issues

## API Endpoints and Request/Response Formats

### 1. Initialize Payment Session

**Endpoint:** `POST /checkout/initialize`

**Request Format:**
```json
{
  "amount": 10,
  "currency": "ETB",
  "reference": "test_1789464322522",
  "description": "Payment description",
  "webhook_url": "https://your-domain.com/webhook",
  "return_url": "https://your-domain.com/success",
  "cancel_url": "https://your-domain.com/cancel",
  "metadata": {
    "customer_id": "12345",
    "order_id": "order_123"
  }
}
```

**Required Fields:**
- `amount` (number): Payment amount
- `currency` (string): Currency code (default: "ETB")
- `reference` (string): Unique payment reference

**Optional Fields:**
- `description` (string): Payment description
- `webhook_url` (string): URL for payment status notifications
- `return_url` (string): Redirect URL after successful payment
- `cancel_url` (string): Redirect URL after cancelled payment
- `metadata` (object): Additional custom data

**Response Format:**
```json
{
  "id": "01a0a462-a864-7f3a-9915-abe214663ff6",
  "amount": 10,
  "currency": "ETB",
  "reference": "test_1789464322522",
  "status": "pending",
  "available_channels": [
    {
      "name": "YaYa Wallet",
      "id": "yayawallet"
    },
    {
      "name": "Card",
      "id": "card"
    }
  ],
  "created_at": "2026-09-14T12:00:00Z"
}
```

### 2. Submit USSD Push Payment

**Endpoint:** `POST /checkout/{paymentId}/pay/yayawallet`

**Request Format:**
```json
{
  "phone_number": "0912345678"
}
```

**Required Fields:**
- `phone_number` (string): User's phone number (must be registered with YaYaWallet)

**Response Format:**
```json
{
  "status": "processing",
  "transaction_id": "01a0a462-a864-7f3a-9915-abe214663ff6",
  "message": "Payment request sent to YaYa Wallet. Please approve on your phone (*957#).",
  "phone_number": "0912345678",
  "channel": "yayawallet"
}
```

### 3. Get Payment Status

**Endpoint:** `GET /checkout/{paymentId}`

**Request Parameters:**
- `paymentId` (path parameter): Payment session ID

**Response Format:**
```json
{
  "id": "01a0a462-a864-7f3a-9915-abe214663ff6",
  "amount": 10,
  "currency": "ETB",
  "reference": "test_1789464322522",
  "status": "pending",
  "message": "Payment is pending user approval",
  "created_at": "2026-09-14T12:00:00Z",
  "updated_at": "2026-09-14T12:05:00Z"
}
```

**Possible Status Values:**
- `pending`: Payment initiated, awaiting user action
- `processing`: Payment is being processed
- `completed`: Payment successfully completed
- `failed`: Payment failed
- `cancelled`: Payment was cancelled by user

## Testing Requirements

### Important: KYC Completion Required for Live Testing

To test the real USSD push flow with actual payments, you must:

1. **Complete KYC on Ghion Dashboard**
   - Log in to your Ghion dashboard at [https://ghion.financial](https://ghion.financial)
   - Complete the Know Your Customer (KYC) verification process
   - Submit required documents for identity verification

2. **Go Live**
   - After KYC approval, request to go live
   - Your account will be moved from sandbox to production mode
   - Live transactions will be enabled

3. **Test Phone Number Requirements**
   - The test phone number must be registered with YaYaWallet
   - Ensure the phone number can receive USSD prompts
   - The user should have sufficient balance in their YaYaWallet account

### Sandbox vs Production

**Sandbox Mode:**
- Use for development and testing
- No real money transactions
- Simulated payment flows
- API endpoints remain the same

**Production Mode:**
- Requires completed KYC
- Real money transactions
- Actual USSD push to phones
- Same API endpoints with live data

## Next Steps

After running the test:

1. Check your phone for the YaYaWallet USSD prompt
2. Approve the payment to complete the transaction
3. Use the payment ID for further testing and monitoring

## Notes

- This implementation uses Node.js built-in `crypto` and `fetch` modules
- No external dependencies required
- Suitable for understanding the API authentication mechanism
- For production use, consider adding retry logic and more robust error handling