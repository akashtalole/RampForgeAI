// Simple connectivity test
const http = require('http');

function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      console.log(`✅ ${description}: Status ${res.statusCode}`);
      resolve(true);
    });
    
    request.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      request.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Testing RampForgeAI connectivity...\n');
  
  const tests = [
    ['http://localhost:8000/', 'Backend root endpoint'],
    ['http://localhost:8000/api/health', 'Backend health check'],
    ['http://localhost:8000/api/v1/status', 'Backend API status'],
  ];
  
  for (const [url, description] of tests) {
    await testEndpoint(url, description);
  }
  
  console.log('\nConnectivity test complete!');
}

runTests();