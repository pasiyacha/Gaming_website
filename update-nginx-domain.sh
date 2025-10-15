#!/bin/bash

# SL Gaming Hub Nginx Configuration Update Script
# This script updates the Nginx configuration to work with the slgaminghub.com domain

echo "Updating Nginx configuration for slgaminghub.com domain..."

# Create the updated Nginx configuration
sudo tee /etc/nginx/conf.d/slgaminghub.conf <<EOL
server {
    listen 80;
    server_name slgaminghub.com www.slgaminghub.com 16.170.236.106;

    # Frontend - serve the built React application
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Add CORS headers for frontend assets
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    }

    # Backend API proxy
    location /api {
        # Remove the /api prefix when forwarding to backend
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        
        # Handle preflight OPTIONS requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Upload directory for static files
    location /uploads {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}

# Redirect www to non-www
server {
    listen 80;
    server_name www.slgaminghub.com;
    return 301 http://slgaminghub.com\$request_uri;
}
EOL

# Remove any old configuration files that might conflict
sudo rm -f /etc/nginx/conf.d/default.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Test the Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Restarting Nginx..."
    sudo systemctl restart nginx
    echo "Nginx restarted successfully!"
    
    # Show Nginx status
    sudo systemctl status nginx --no-pager
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

echo "Configuration update completed!"
echo "Your application should now be accessible at:"
echo "  - http://slgaminghub.com"
echo "  - http://16.170.236.106"