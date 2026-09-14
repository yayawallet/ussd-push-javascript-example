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

## API Endpoints Used

- `POST /checkout/initialize` - Initialize payment session
- `POST /checkout/{paymentId}/pay/yayawallet` - Submit USSD push payment
- `GET /checkout/{paymentId}` - Get payment status

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