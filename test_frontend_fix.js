// Test the frontend authentication fix
const API_BASE = 'http://localhost:8000';

async function testFrontendAuth() {
    console.log('🔍 Testing Frontend Authentication Fix');
    console.log('=' * 50);
    
    // Test login
    console.log('\n1. Testing login with correct URL...');
    
    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword123'
            }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const authResponse = await response.json();
        console.log('✅ Login successful!');
        console.log(`Token: ${authResponse.access_token.substring(0, 30)}...`);
        console.log(`User: ${authResponse.user.name}`);
        
        // Test token verification
        console.log('\n2. Testing token verification...');
        const verifyResponse = await fetch(`${API_BASE}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${authResponse.access_token}`,
            },
        });
        
        if (verifyResponse.ok) {
            console.log('✅ Token verification successful!');
        } else {
            console.log('❌ Token verification failed');
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Run the test
testFrontendAuth();