#!/bin/bash

# Quick CORS Test Script
# Run this script to test if the CORS fixes are working

echo "🧪 Testing CORS Configuration..."
echo "================================="

# Test 1: Check if the malformed URL issue is fixed in frontend config
echo "1. Checking frontend API configuration..."

if [ -f "SlGamingHub-frontend/.env.production" ]; then
    API_URL=$(grep VITE_API_URL SlGamingHub-frontend/.env.production | cut -d'=' -f2)
    echo "   API URL: $API_URL"
    
    if [[ $API_URL == *","* ]]; then
        echo "   ❌ FAILED: API URL still contains commas (malformed)"
        echo "   🔧 Fix: Update .env.production to use a single clean URL"
    else
        echo "   ✅ PASSED: API URL is clean"
    fi
else
    echo "   ⚠️ WARNING: .env.production file not found"
fi

echo ""

# Test 2: Check if backend CORS configuration includes the domain
echo "2. Checking backend CORS configuration..."

if grep -q "slgaminghub.com" SlGamingHub-backend/index.js; then
    echo "   ✅ PASSED: Backend includes slgaminghub.com in CORS origins"
else
    echo "   ❌ FAILED: Backend missing slgaminghub.com in CORS origins"
    echo "   🔧 Fix: Update backend CORS configuration"
fi

echo ""

# Test 3: Check if API routes are properly configured
echo "3. Checking API route configuration..."

if grep -q 'app.use("/users"' SlGamingHub-backend/index.js; then
    echo "   ✅ PASSED: Backend routes configured without /api prefix"
else
    echo "   ❌ FAILED: Backend routes still use /api prefix"
    echo "   🔧 Fix: Remove /api prefix from backend routes"
fi

echo ""

# Test 4: Validate frontend API config
echo "4. Checking frontend API configuration..."

if grep -q "slgaminghub.com/api" SlGamingHub-frontend/src/config/apiConfig.js; then
    echo "   ✅ PASSED: Frontend configured to use domain"
else
    echo "   ❌ FAILED: Frontend not configured for domain"
    echo "   🔧 Fix: Update frontend API configuration"
fi

echo ""

# Test 5: Check if deployment scripts exist
echo "5. Checking deployment scripts..."

if [ -f "comprehensive-fix-deployment.sh" ]; then
    echo "   ✅ PASSED: Comprehensive deployment script available"
else
    echo "   ❌ FAILED: Deployment script missing"
fi

if [ -f "fix-nginx-cors.sh" ]; then
    echo "   ✅ PASSED: Nginx CORS fix script available"
else
    echo "   ❌ FAILED: Nginx fix script missing"
fi

echo ""
echo "================================="
echo "🏁 Test Summary Complete"
echo ""
echo "📋 Next Steps:"
echo "1. Upload all files to your EC2 instance"
echo "2. Run: chmod +x comprehensive-fix-deployment.sh"
echo "3. Run: ./comprehensive-fix-deployment.sh"
echo "4. Test your application at http://slgaminghub.com"
echo ""
echo "🔧 If issues persist, check:"
echo "   - DNS settings for slgaminghub.com"
echo "   - EC2 security groups allow port 80"
echo "   - Domain is properly pointed to your EC2 IP"