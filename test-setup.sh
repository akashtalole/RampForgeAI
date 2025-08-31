#!/bin/bash

echo "Testing RampForgeAI setup..."

# Test backend health endpoint
echo "Testing backend health endpoint..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend health endpoint is accessible"
else
    echo "❌ Backend health endpoint is not accessible"
fi

# Test backend API status
echo "Testing backend API status..."
if curl -f http://localhost:8000/api/v1/status > /dev/null 2>&1; then
    echo "✅ Backend API status endpoint is accessible"
else
    echo "❌ Backend API status endpoint is not accessible"
fi

# Test frontend
echo "Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo "Setup test complete!"