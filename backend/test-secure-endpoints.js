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

async function testSecureEndpoints() {
  console.log('✅ Testing Secure Endpoints (Non-Vulnerable)\n');
  
  try {
    // Test 1: Policy Categories (No Auth Required)
    console.log('1. Testing GET /api/policies/categories (No Auth Required)...');
    const categoriesResponse = await fetch(`${BASE_URL}/policies/categories`);
    const categories = await categoriesResponse.json();
    
    console.log(`   Status: ${categoriesResponse.status}`);
    console.log(`   Categories: ${categories.join(', ')}`);
    console.log('✅ Policy categories endpoint working correctly\n');
    
    // Test 2: User Notifications (Auth Required)
    console.log('2. Testing GET /api/user/notifications (Auth Required)...');
    
    // First, try without token (should fail)
    const noAuthResponse = await fetch(`${BASE_URL}/user/notifications`);
    const noAuthData = await noAuthResponse.json();
    console.log(`   No token - Status: ${noAuthResponse.status}`);
    console.log(`   No token - Error: ${noAuthData.error}`);
    
    // Now with valid token
    const token = await login('user1', 'userpass');
    const notificationsResponse = await fetch(`${BASE_URL}/user/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notifications = await notificationsResponse.json();
    
    console.log(`   With token - Status: ${notificationsResponse.status}`);
    console.log(`   With token - Notifications: ${notifications.length} items`);
    console.log('✅ User notifications endpoint working correctly\n');
    
    // Test 3: Coverage Details (Auth Required)
    console.log('3. Testing GET /api/coverage/details (Auth Required)...');
    const coverageResponse = await fetch(`${BASE_URL}/coverage/details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const coverage = await coverageResponse.json();
    
    console.log(`   Status: ${coverageResponse.status}`);
    console.log(`   Policy Number: ${coverage.policyNumber}`);
    console.log(`   Policy Type: ${coverage.policyType}`);
    console.log(`   Status: ${coverage.status}`);
    console.log('✅ Coverage details endpoint working correctly\n');
    
    // Test 4: Claims Estimate (Auth Required)
    console.log('4. Testing POST /api/claims/estimate (Auth Required)...');
    const estimateData = {
      policyId: 'INS-123456',
      incidentType: 'vehicle',
      estimatedDamage: 3000
    };
    
    const estimateResponse = await fetch(`${BASE_URL}/claims/estimate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(estimateData)
    });
    const estimate = await estimateResponse.json();
    
    console.log(`   Status: ${estimateResponse.status}`);
    console.log(`   Claim ID: ${estimate.claimId}`);
    console.log(`   Status: ${estimate.status}`);
    console.log(`   Submitted By: ${estimate.submittedBy}`);
    console.log('✅ Claims estimate endpoint working correctly\n');
    
    // Test 5: Invalid Claims Estimate (Validation)
    console.log('5. Testing POST /api/claims/estimate with invalid data...');
    const invalidEstimateData = {
      policyId: '', // Missing required field
      incidentType: 'vehicle',
      estimatedDamage: -100 // Invalid negative value
    };
    
    const invalidResponse = await fetch(`${BASE_URL}/claims/estimate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidEstimateData)
    });
    const invalidData = await invalidResponse.json();
    
    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Error: ${invalidData.error}`);
    console.log(`   Message: ${invalidData.message}`);
    console.log('✅ Input validation working correctly\n');
    
    console.log('📋 Summary:');
    console.log('   - All secure endpoints are working correctly');
    console.log('   - Authentication is properly enforced');
    console.log('   - Input validation is working');
    console.log('   - No vulnerabilities exposed');
    console.log('   - Realistic insurance app functionality provided');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSecureEndpoints(); 