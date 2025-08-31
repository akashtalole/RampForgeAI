#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 RampForgeAI Setup Verification\n');

// Test backend connectivity
function testBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend is running and healthy');
          try {
            const health = JSON.parse(data);
            console.log(`   Status: ${health.status}`);
            console.log(`   Version: ${health.version}`);
          } catch (e) {
            console.log('   Response received but could not parse JSON');
          }
          resolve(true);
        } else {
          console.log(`❌ Backend responded with status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend is not accessible');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend connection timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test frontend connectivity
function testFrontend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Frontend is running');
        resolve(true);
      } else {
        console.log(`❌ Frontend responded with status ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend is not accessible');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Frontend connection timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('Testing backend connectivity...');
  const backendOk = await testBackend();
  
  console.log('\nTesting frontend connectivity...');
  const frontendOk = await testFrontend();
  
  console.log('\n📋 Setup Status:');
  console.log(`Backend (http://localhost:8000): ${backendOk ? '✅ OK' : '❌ Not Running'}`);
  console.log(`Frontend (http://localhost:3000): ${frontendOk ? '✅ OK' : '❌ Not Running'}`);
  
  if (!backendOk || !frontendOk) {
    console.log('\n🔧 To start the services:');
    if (!backendOk) {
      console.log('Backend: npm run dev:backend');
    }
    if (!frontendOk) {
      console.log('Frontend: npm run dev:frontend');
    }
    console.log('\nOr start both with Docker: npm run dev');
  } else {
    console.log('\n🎉 All services are running! You can access:');
    console.log('Frontend: http://localhost:3000');
    console.log('Backend API: http://localhost:8000/api/docs');
    console.log('API Test Page: http://localhost:3000/test-api');
  }
}

main().catch(console.error);