const fetch = require('node-fetch');

async function testVerifyOTP() {
  try {
    const response = await fetch('http://147.93.179.153:3004/api/verify/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'cb0a5cb9-131e-496a-a7c5-a5fa8b5f6f0f', // User ID
        otp: '834022', // OTP from database
      }),
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testVerifyOTP();
