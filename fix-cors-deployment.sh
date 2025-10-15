#!/bin/bash

# SL Gaming Hub CORS Fix Deployment Script
# This script fixes the CORS and URL configuration issues

echo "🚀 Starting SL Gaming Hub CORS Fix Deployment..."

# Navigate to the backend directory
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend

# Update the .env file with correct CORS origins
echo "📝 Updating backend environment variables..."
cat > .env <<EOL
# Server configuration
PORT=5000
NODE_ENV=production

# MongoDB connection
MONGO_URL='mongodb+srv://forever:forever123@cluster0.qbgajlz.mongodb.net/new'

# JWT Secret
JWT_SECRET=secure_jwt_secret_for_sl_gaming_hub_production
JWT_EXPIRY=30d

# CORS configuration - Updated for domain
CORS_ORIGINS=http://slgaminghub.com,https://slgaminghub.com,http://16.170.236.106,https://16.170.236.106,http://localhost:5173,http://localhost:3000

# Email configuration
EMAIL_USER=slgaminghub62@gmail.com
EMAIL_PASS=oruxobffojypgeje

# Admin settings
ADMIN_EMAIL=admin@slgaminghub.com
API_HOST=slgaminghub.com
EOL

# Restart the backend server
echo "🔄 Restarting backend server..."
pm2 restart slgaming-api || pm2 start index.js --name "slgaming-api"

# Update the frontend environment
cd /home/ec2-user/SLGamingHub/SlGamingHub-frontend

echo "📝 Updating frontend environment variables..."
cat > .env.production <<EOL
# SL Gaming Hub Production Environment Configuration

# API URL for production (using domain name)
VITE_API_URL=http://slgaminghub.com/api

# Application mode
VITE_APP_MODE=production

# Application name
VITE_APP_NAME=SL Gaming Hub

# Enable API logging temporarily for debugging
VITE_API_LOGGING=true
EOL

# Rebuild the frontend
echo "🏗️ Building frontend..."
npm run build

# Update Nginx configuration
echo "⚙️ Updating Nginx configuration..."
sudo tee /etc/nginx/conf.d/slgaminghub.conf <<EOL
server {
    listen 80;
    server_name slgaminghub.com www.slgaminghub.com 16.170.236.106;

    # Frontend
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files \\\$uri \\\$uri/ /index.html;
    }

    # Backend API proxy - Fixed routing
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_redirect off;
        
        # Handle CORS preflight
        if (\\\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 86400;
            return 204;
        }
    }

    # Upload directory
    location /uploads/ {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads/;
    }
}

# Redirect www to non-www
server {
    listen 80;
    server_name www.slgaminghub.com;
    return 301 http://slgaminghub.com\\\$request_uri;
}
EOL

# Remove old conflicting configs
sudo rm -f /etc/nginx/conf.d/default.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
echo "🔧 Testing and restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# Show status
echo "📊 Service Status:"
echo "Backend (PM2):"
pm2 status slgaming-api

echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your application should now be accessible at:"
echo "   - http://slgaminghub.com"
echo "   - http://16.170.236.106"
echo ""
echo "🔍 To test the API directly:"
echo "   curl http://slgaminghub.com/api/test"
echo "   curl http://localhost:5000/test"
EOL