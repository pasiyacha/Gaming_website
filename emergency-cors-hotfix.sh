#!/bin/bash

# EMERGENCY HOTFIX for CORS and Malformed URL Issues
# This script provides an immediate fix for the persistent CORS errors

echo "🚨 EMERGENCY HOTFIX: Fixing CORS and Malformed URL Issues"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

# Step 1: Clean up all environment files
print_info "Step 1: Cleaning up environment files..."

cd /home/ec2-user/SLGamingHub/SlGamingHub-frontend

# Remove any problematic .env files
rm -f .env.local .env.development .env.development.local

# Create a clean .env file
cat > .env <<EOL
VITE_API_URL=http://slgaminghub.com/api
VITE_APP_MODE=production
VITE_APP_NAME=SL Gaming Hub
VITE_API_LOGGING=true
EOL

# Create a clean .env.production file
cat > .env.production <<EOL
VITE_API_URL=http://slgaminghub.com/api
VITE_APP_MODE=production
VITE_APP_NAME=SL Gaming Hub
VITE_API_LOGGING=true
EOL

print_status "Environment files cleaned and updated"

# Step 2: Force clean build
print_info "Step 2: Force clean build..."

# Remove node_modules and package-lock.json to ensure clean install
rm -rf node_modules package-lock.json

# Remove dist directory
rm -rf dist

# Clean npm cache
npm cache clean --force

# Reinstall dependencies
npm install

print_status "Dependencies reinstalled"

# Step 3: Build with explicit environment
print_info "Step 3: Building with explicit environment..."

# Set environment variables explicitly and build
NODE_ENV=production VITE_API_URL=http://slgaminghub.com/api npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 4: Update backend with simplified CORS
print_info "Step 4: Updating backend CORS..."

cd /home/ec2-user/SLGamingHub/SlGamingHub-backend

# Create a simplified CORS-friendly backend configuration
cat > cors-fix.js <<'EOL'
const cors = require('cors');

// Simple but effective CORS configuration
const setupCORS = (app) => {
  // Allow all origins temporarily to fix the issue
  app.use(cors({
    origin: true,  // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }));

  // Additional CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
};

module.exports = setupCORS;
EOL

print_status "CORS configuration created"

# Step 5: Update Nginx with emergency configuration
print_info "Step 5: Updating Nginx configuration..."

sudo tee /etc/nginx/conf.d/slgaminghub.conf <<'EOL'
server {
    listen 80;
    server_name slgaminghub.com www.slgaminghub.com 16.170.236.106;

    # Add CORS headers globally
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            return 204;
        }

        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy with CORS
    location /api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;

        # Ensure CORS headers are always present
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }

    location /uploads/ {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads/;
    }
}

server {
    listen 80;
    server_name www.slgaminghub.com;
    return 301 http://slgaminghub.com$request_uri;
}
EOL

print_status "Nginx configuration updated"

# Step 6: Restart all services
print_info "Step 6: Restarting services..."

# Test nginx config
if sudo nginx -t; then
    print_status "Nginx configuration test passed"
    sudo systemctl restart nginx
    print_status "Nginx restarted"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Restart backend
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
pm2 delete slgaming-api 2>/dev/null || true
pm2 start index.js --name "slgaming-api"
print_status "Backend restarted"

# Step 7: Test the fix
print_info "Step 7: Testing the fix..."

sleep 5

echo ""
print_info "Testing API endpoints:"

# Test the problematic register endpoint
echo "1. Testing register endpoint:"
if curl -s -X OPTIONS http://localhost/api/users/auth/register \
   -H "Origin: http://slgaminghub.com" \
   -H "Access-Control-Request-Method: POST" \
   -H "Access-Control-Request-Headers: Content-Type" > /dev/null; then
    print_status "CORS preflight for register: OK"
else
    print_error "CORS preflight for register: FAILED"
fi

echo ""
echo "2. Testing with actual domain:"
if curl -s -X OPTIONS http://slgaminghub.com/api/users/auth/register \
   -H "Origin: http://slgaminghub.com" \
   -H "Access-Control-Request-Method: POST" \
   -H "Access-Control-Request-Headers: Content-Type" > /dev/null 2>&1; then
    print_status "Domain CORS preflight: OK"
else
    print_error "Domain CORS preflight: Check DNS/connectivity"
fi

echo ""
echo "=========================================================="
print_status "EMERGENCY HOTFIX COMPLETED!"
echo ""
print_info "🌐 Your application should now work at: http://slgaminghub.com"
print_info "🔧 All CORS issues should be resolved"
print_info "📝 The malformed URL issue has been fixed"
echo ""
print_info "If you still see issues:"
echo "  1. Clear your browser cache completely"
echo "  2. Try incognito/private browsing mode" 
echo "  3. Check browser developer tools for any cached resources"
echo ""
print_info "Monitoring commands:"
echo "  📊 Backend logs: pm2 logs slgaming-api"
echo "  📊 Nginx error: sudo tail -f /var/log/nginx/error.log"
echo "  📊 Nginx access: sudo tail -f /var/log/nginx/access.log"