const fetch = require('node-fetch');

async function testOrganizationCreation() {
  try {
    const response = await fetch('http://localhost:3004/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Organization 2',
        admin: {
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'Admin',
          autoGeneratePassword: true,
          requiresVerification: true,
        },
      }),
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrganizationCreation();
