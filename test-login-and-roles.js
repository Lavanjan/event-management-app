const axios = require('axios');

async function testLoginAndRoles() {
  try {
    console.log('🔐 Testing login for new organization admin...');
    
    // Step 1: Login
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'testfixed3@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user);
    console.log('Session ID:', loginResponse.data.sessionId);
    
    const sessionId = loginResponse.data.sessionId;
    
    // Step 2: Test enhanced roles API
    console.log('\n🔧 Testing enhanced roles API...');

    try {
      const rolesResponse = await axios.get('http://localhost:3002/api/enhanced-roles', {
        headers: {
          'Cookie': `sessionId=${sessionId}`
        }
      });

      console.log('✅ Enhanced roles API successful!');
      console.log('Roles data:', rolesResponse.data);
    } catch (rolesError) {
      console.log('⚠️ Enhanced roles API error (expected):', rolesError.response?.data?.message);
    }

    // Step 3: Test inventory API (the original failing API)
    console.log('\n📦 Testing inventory out-of-stock API...');

    try {
      const inventoryResponse = await axios.get('http://localhost:3002/api/inventory/out-of-stock', {
        headers: {
          'Cookie': `sessionId=${sessionId}`
        }
      });

      console.log('✅ Inventory API successful!');
      console.log('Inventory data:', inventoryResponse.data);
    } catch (inventoryError) {
      console.log('❌ Inventory API error:', inventoryError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLoginAndRoles();
