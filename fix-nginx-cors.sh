#!/bin/bash

# Comprehensive CORS Fix for SL Gaming Hub
# This script addresses all potential CORS issues

echo "🔧 Fixing CORS issues comprehensively..."

# Create a robust Nginx configuration
sudo tee /etc/nginx/conf.d/slgaminghub.conf <<'EOL'
# Enable CORS for all locations
map $http_origin $cors_header {
    default "";
    "~^https?://slgaminghub\.com$" "$http_origin";
    "~^https?://www\.slgaminghub\.com$" "$http_origin";
    "~^https?://16\.170\.236\.106$" "$http_origin";
    "~^https?://localhost:3000$" "$http_origin";
    "~^https?://localhost:5173$" "$http_origin";
}

server {
    listen 80;
    server_name slgaminghub.com www.slgaminghub.com 16.170.236.106;

    # Global CORS settings
    add_header 'Access-Control-Allow-Origin' $cors_header always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Handle preflight requests globally
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' $cors_header always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Frontend - serve the built React application
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Ensure CORS for frontend assets
        add_header 'Access-Control-Allow-Origin' $cors_header always;
    }

    # Backend API proxy
    location /api/ {
        # Forward to backend without /api prefix
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
        
        # Ensure CORS headers are passed through
        proxy_hide_header 'Access-Control-Allow-Origin';
        proxy_hide_header 'Access-Control-Allow-Methods';
        proxy_hide_header 'Access-Control-Allow-Headers';
        
        # Add our CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_header always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }

    # Upload directory for static files
    location /uploads/ {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads/;
        add_header 'Access-Control-Allow-Origin' $cors_header always;
    }

    # Error and access logs
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

# Remove old configs
sudo rm -f /etc/nginx/conf.d/default.conf
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null

# Test configuration
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo "🔧 CORS configuration updated successfully!"