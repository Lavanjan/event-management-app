const fetch = require('node-fetch');

async function testCreateOrganization() {
  try {
    const response = await fetch('http://localhost:3002/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test Organization ${Date.now()}`,
        description: 'Test organization for API testing',
        admin: {
          email: `test${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Admin',
          password: 'TestPassword123!',
          autoGeneratePassword: false,
          requiresVerification: false
        }
      })
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateOrganization();
