# SL_Gaming_Hub (Fixed)

This branch contains fixes to the registration flow to send OTP to both Email and WhatsApp (via Twilio).
Files modified:
- controller/user.js (reworked register + verifyOtp + login functions)
- .env.example added
- README added

## Setup

1. Copy `.env.example` to `.env` and fill your credentials (MongoDB, SMTP, Twilio).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   or for development:
   ```bash
   npm run dev
   ```

## Endpoints

- POST /auth/register
  body: `{ name, email, password, confirmPassword, phone, role }`
  - will create user and send OTP to email and WhatsApp (if phone provided)

- POST /auth/verify-otp
  body: `{ userId, code, type }` where type is "email" or "phone"

Notes:
- If you don't want live sending, you can leave SMTP/Twilio vars empty — sending functions will fail but user creation will succeed.
- Make sure Twilio WhatsApp sandbox/number is configured for your destination phone number.
