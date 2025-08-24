#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing for infinite API calls on dashboard...\n');

let verifyCallCount = 0;
let meCallCount = 0;
let healthCallCount = 0;
let totalCallCount = 0;
let startTime = Date.now();

// Create a simple proxy server to monitor requests
const proxyServer = http.createServer((req, res) => {
  totalCallCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  if (req.url.includes('/verify')) {
    verifyCallCount++;
    console.log(`⚠️  [${timestamp}] VERIFY call #${verifyCallCount}: ${req.url}`);
  }
  
  if (req.url.includes('/me')) {
    meCallCount++;
    console.log(`👤 [${timestamp}] ME call #${meCallCount}: ${req.url}`);
  }
  
  if (req.url.includes('/health')) {
    healthCallCount++;
    if (healthCallCount <= 3) { // Only log first few health calls
      console.log(`✅ [${timestamp}] Health check #${healthCallCount}: ${req.url}`);
    }
  }
  
  // Forward the request to the actual backend
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500);
    res.end('Proxy error');
  });
  
  req.pipe(proxyReq);
});

proxyServer.listen(8001, () => {
  console.log('🔍 Monitoring proxy server started on port 8001');
  console.log('📝 To test: Update NEXT_PUBLIC_API_URL=http://localhost:8001 in your .env.local');
  console.log('⏱️  Monitoring for 60 seconds...\n');
  
  // Monitor for 60 seconds
  setTimeout(() => {
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n📊 Monitoring Results:');
    console.log(`Duration: ${duration}s`);
    console.log(`Total API calls: ${totalCallCount}`);
    console.log(`Health check calls: ${healthCallCount} (${(healthCallCount/duration).toFixed(1)}/s)`);
    console.log(`Verify calls: ${verifyCallCount} (${(verifyCallCount/duration).toFixed(1)}/s)`);
    console.log(`Me calls: ${meCallCount} (${(meCallCount/duration).toFixed(1)}/s)`);
    
    // Analysis
    if (verifyCallCount > 5) {
      console.log('❌ ISSUE: Too many verify calls! Expected: 1-2 max');
    } else {
      console.log('✅ GOOD: Verify calls are within normal range');
    }
    
    if (meCallCount > 5) {
      console.log('❌ ISSUE: Too many /me calls! Expected: 1-2 max');
    } else {
      console.log('✅ GOOD: /me calls are within normal range');
    }
    
    if (healthCallCount > duration * 2) { // More than 2 per second
      console.log('❌ ISSUE: Too many health check calls!');
    } else {
      console.log('✅ GOOD: Health check frequency is normal');
    }
    
    proxyServer.close();
    process.exit(0);
  }, 60000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Monitoring stopped by user');
  proxyServer.close();
  process.exit(0);
});