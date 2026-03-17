const fetch = global.fetch || ((...args) =>
  import('node-fetch').then(({ default: nodeFetch }) => nodeFetch(...args))
);
const BASE_URL = 'http://localhost:3001/api';

async function testExcessiveRecordRetrieval() {
  console.log('🔍 Testing Excessive Record Retrieval Vulnerability (API4:2023)\n');
  
  try {
    // Test normal search (UI behavior)
    console.log('1. Testing normal search (per_page=10)...');
    const normalResponse = await fetch(`${BASE_URL}/policies/search?query=john&page=1&per_page=10`);
    const normalData = await normalResponse.json();
    
    console.log(`   Status: ${normalResponse.status}`);
    console.log(`   Records returned: ${normalData.policies.length}`);
    console.log(`   Total records available: ${normalData.pagination.total}`);
    console.log(`   Response size: ~${JSON.stringify(normalData).length} characters`);
    console.log('✅ Normal search returns reasonable number of records\n');
    
    // Test vulnerable search (attacker behavior)
    console.log('2. Testing excessive record retrieval (per_page=1000)...');
    const startTime = Date.now();
    const vulnerableResponse = await fetch(`${BASE_URL}/policies/search?query=&page=1&per_page=1000`);
    const vulnerableData = await vulnerableResponse.json();
    const endTime = Date.now();
    
    console.log(`   Status: ${vulnerableResponse.status}`);
    console.log(`   Records returned: ${vulnerableData.policies.length}`);
    console.log(`   Response size: ~${JSON.stringify(vulnerableData).length} characters`);
    console.log(`   Response time: ${endTime - startTime}ms`);
    console.log('🚨 VULNERABLE: Excessive records returned without limit!\n');
    
    // Test even more excessive request
    console.log('3. Testing extreme record retrieval (per_page=1500)...');
    const extremeStartTime = Date.now();
    const extremeResponse = await fetch(`${BASE_URL}/policies/search?query=&page=1&per_page=1500`);
    const extremeData = await extremeResponse.json();
    const extremeEndTime = Date.now();
    
    console.log(`   Status: ${extremeResponse.status}`);
    console.log(`   Records returned: ${extremeData.policies.length}`);
    console.log(`   Response size: ~${JSON.stringify(extremeData).length} characters`);
    console.log(`   Response time: ${extremeEndTime - extremeStartTime}ms`);
    console.log('🚨 VULNERABLE: No maximum limit enforced!\n');
    
    // Test with search query
    console.log('4. Testing search with query and excessive records...');
    const searchResponse = await fetch(`${BASE_URL}/policies/search?query=john&page=1&per_page=500`);
    const searchData = await searchResponse.json();
    
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Records returned: ${searchData.policies.length}`);
    console.log(`   Search query: "${searchData.searchQuery}"`);
    console.log(`   Filtered results: ${searchData.policies.length} out of ${searchData.pagination.total} total`);
    console.log('🚨 VULNERABLE: Search filtering works but no pagination limit!\n');
    
    console.log('📋 Summary:');
    console.log('   - Normal UI requests: ✅ Limited to reasonable number of records');
    console.log('   - Manual parameter tampering: 🚨 VULNERABLE - No maximum limit enforced');
    console.log('   - Attack impact: Potential DoS, data exfiltration, performance degradation');
    console.log('   - Vulnerability: Missing per_page maximum limit validation');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testExcessiveRecordRetrieval(); 