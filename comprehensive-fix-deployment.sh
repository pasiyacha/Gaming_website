#!/bin/bash

# Comprehensive CORS and API Fix Deployment Script
# This script fixes all identified issues in the SL Gaming Hub project

echo "🚀 Starting Comprehensive CORS Fix Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're running as the correct user
if [ "$(whoami)" != "ec2-user" ]; then
    print_error "This script should be run as ec2-user"
    exit 1
fi

# Navigate to the project directory
cd /home/ec2-user/SLGamingHub || {
    print_error "Failed to navigate to /home/ec2-user/SLGamingHub"
    exit 1
}

print_info "Pulling latest changes from repository..."
git pull origin main

# Step 1: Update Backend Configuration
print_info "Step 1: Updating backend configuration..."

cd SlGamingHub-backend

# Create/update .env file
print_info "Creating backend .env file..."
cat > .env <<EOL
# Server configuration
PORT=5000
NODE_ENV=production

# MongoDB connection
MONGO_URL='mongodb+srv://forever:forever123@cluster0.qbgajlz.mongodb.net/new'

# JWT Secret
JWT_SECRET=secure_jwt_secret_for_sl_gaming_hub_production_$(date +%s)
JWT_EXPIRY=30d

# CORS configuration - Updated for domain
CORS_ORIGINS=http://slgaminghub.com,https://slgaminghub.com,http://16.170.236.106,https://16.170.236.106

# Email configuration
EMAIL_USER=slgaminghub62@gmail.com
EMAIL_PASS=oruxobffojypgeje

# Admin settings
ADMIN_EMAIL=admin@slgaminghub.com
API_HOST=slgaminghub.com
EOL

print_status "Backend .env file updated"

# Install dependencies if needed
print_info "Installing backend dependencies..."
npm install --production

# Step 2: Update Frontend Configuration
print_info "Step 2: Updating frontend configuration..."

cd ../SlGamingHub-frontend

# Create/update .env.production file
print_info "Creating frontend .env.production file..."
cat > .env.production <<EOL
# SL Gaming Hub Production Environment Configuration

# API URL for production (using domain name)
VITE_API_URL=http://slgaminghub.com/api

# Application mode
VITE_APP_MODE=production

# Application name
VITE_APP_NAME=SL Gaming Hub

# Enable API logging for debugging
VITE_API_LOGGING=true
EOL

print_status "Frontend .env.production file updated"

# Install dependencies if needed
print_info "Installing frontend dependencies..."
npm install

# Build the frontend
print_info "Building frontend application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 3: Update Nginx Configuration
print_info "Step 3: Updating Nginx configuration..."

sudo tee /etc/nginx/conf.d/slgaminghub.conf <<'EOL'
# CORS origin mapping
map $http_origin $cors_header {
    default "";
    "~^https?://slgaminghub\.com$" "$http_origin";
    "~^https?://www\.slgaminghub\.com$" "$http_origin";  
    "~^https?://16\.170\.236\.106$" "$http_origin";
}

server {
    listen 80;
    server_name slgaminghub.com www.slgaminghub.com 16.170.236.106;

    # Frontend - serve the built React application
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        # Remove /api prefix and forward to backend
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
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_header always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_header always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Upload directory
    location /uploads/ {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads/;
        add_header 'Access-Control-Allow-Origin' $cors_header always;
    }

    # Logging
    error_log /var/log/nginx/slgaminghub_error.log;
    access_log /var/log/nginx/slgaminghub_access.log;
}

# Redirect www to non-www
server {
    listen 80;
    server_name www.slgaminghub.com;
    return 301 http://slgaminghub.com$request_uri;
}
EOL

print_status "Nginx configuration updated"

# Remove conflicting configurations
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration test passed"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 4: Restart Services
print_info "Step 4: Restarting services..."

# Restart backend
print_info "Restarting backend server..."
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
pm2 delete slgaming-api 2>/dev/null || true
pm2 start index.js --name "slgaming-api"

if [ $? -eq 0 ]; then
    print_status "Backend server restarted successfully"
else
    print_error "Failed to restart backend server"
    exit 1
fi

# Restart Nginx
print_info "Restarting Nginx..."
sudo systemctl restart nginx

if [ $? -eq 0 ]; then
    print_status "Nginx restarted successfully"
else
    print_error "Failed to restart Nginx"
    exit 1
fi

# Step 5: Verify Services
print_info "Step 5: Verifying services..."

echo ""
print_info "Service Status:"
echo "Backend (PM2):"
pm2 status slgaming-api

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

# Step 6: Test API Connectivity
print_info "Step 6: Testing API connectivity..."

sleep 3  # Give services time to start

echo ""
print_info "Testing API endpoints:"

# Test direct backend
echo "1. Testing direct backend connection:"
if curl -s http://localhost:5000/test > /dev/null; then
    print_status "Direct backend connection: OK"
    curl -s http://localhost:5000/test | jq .
else
    print_warning "Direct backend connection: FAILED"
fi

echo ""

# Test through Nginx
echo "2. Testing API through Nginx:"
if curl -s http://localhost/api/test > /dev/null; then
    print_status "API through Nginx: OK"
    curl -s http://localhost/api/test | jq .
else
    print_warning "API through Nginx: FAILED"
fi

echo ""

# Test from domain (if accessible)
echo "3. Testing from domain:"
if curl -s http://slgaminghub.com/api/test > /dev/null 2>&1; then
    print_status "Domain API access: OK"
    curl -s http://slgaminghub.com/api/test | jq .
else
    print_warning "Domain API access: Check DNS settings"
fi

echo ""
echo "=================================================="
print_status "Deployment completed successfully!"
echo ""
print_info "Your application should now be accessible at:"
echo "  🌐 http://slgaminghub.com"
echo "  🌐 http://16.170.236.106"
echo ""
print_info "API endpoints:"
echo "  📡 http://slgaminghub.com/api/test"
echo "  📡 http://slgaminghub.com/api/users/auth/login"
echo ""
print_info "To monitor services:"
echo "  🔍 Backend logs: pm2 logs slgaming-api"
echo "  🔍 Nginx logs: sudo tail -f /var/log/nginx/slgaminghub_error.log"
echo "  🔍 Access logs: sudo tail -f /var/log/nginx/slgaminghub_access.log"