#!/bin/bash

# Quick Verification Script
# Run this to verify the CORS fix is working

echo "🔍 Verifying CORS Fix..."
echo "========================="

# Test 1: Check if environment files are correct
echo "1. Checking environment configuration:"
if [ -f "/home/ec2-user/SLGamingHub/SlGamingHub-frontend/.env" ]; then
    API_URL=$(grep VITE_API_URL /home/ec2-user/SLGamingHub/SlGamingHub-frontend/.env | cut -d'=' -f2)
    if [[ $API_URL == *","* ]]; then
        echo "   ❌ FAILED: .env still contains malformed URL"
    else
        echo "   ✅ PASSED: .env has clean URL: $API_URL"
    fi
else
    echo "   ⚠️ WARNING: .env file not found"
fi

# Test 2: Check API connectivity
echo ""
echo "2. Testing API connectivity:"
if curl -s http://localhost:5000/test > /dev/null; then
    echo "   ✅ PASSED: Backend is responding"
else
    echo "   ❌ FAILED: Backend not responding"
fi

# Test 3: Check CORS headers
echo ""
echo "3. Testing CORS headers:"
CORS_HEADER=$(curl -s -I -X OPTIONS http://localhost/api/users/auth/register \
    -H "Origin: http://slgaminghub.com" | grep -i "access-control-allow-origin")

if [ -n "$CORS_HEADER" ]; then
    echo "   ✅ PASSED: CORS headers present"
    echo "   📋 Header: $CORS_HEADER"
else
    echo "   ❌ FAILED: CORS headers missing"
fi

# Test 4: Check Nginx configuration
echo ""
echo "4. Testing Nginx configuration:"
if sudo nginx -t 2>/dev/null; then
    echo "   ✅ PASSED: Nginx configuration valid"
else
    echo "   ❌ FAILED: Nginx configuration invalid"
fi

echo ""
echo "========================="
echo "🏁 Verification Complete"

# Provide next steps
echo ""
echo "📋 If any tests failed, run: ./emergency-cors-hotfix.sh"
echo "🌐 Test your app at: http://slgaminghub.com"