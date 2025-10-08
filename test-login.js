const fetch = require('node-fetch');
require('dotenv').config();

async function testLogin() {
  try {
    // First, let's get the user's current password from database
    // We know the user was created and verified, so let's try to login

    const apiUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3002';
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test1759119346906@example.com',
        password: 'TestPassword123!'
      })
    });

    const result = await response.json();
    console.log('Login Response Status:', response.status);
    console.log('Login Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      // Extract cookies from login response
      const cookies = response.headers.raw()['set-cookie'];
      console.log('Cookies received:', cookies);

      // Test inventory API with the session
      const apiUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3002';
      const inventoryResponse = await fetch(`${apiUrl}/api/inventory?page=1&limit=20&search=&sortBy=name&sortOrder=ASC`, {
        method: 'GET',
        headers: {
          'Cookie': cookies ? cookies.join('; ') : ''
        }
      });
      
      const inventoryResult = await inventoryResponse.json();
      console.log('\nInventory Response Status:', inventoryResponse.status);
      console.log('Inventory Response:', JSON.stringify(inventoryResult, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
