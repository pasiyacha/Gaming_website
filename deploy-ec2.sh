#!/bin/bash

# SL Gaming Hub EC2 Deployment Script for Amazon Linux
# Run this script on your EC2 instance after uploading your project files

# Update system
echo "Updating system packages..."
sudo yum update -y

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install git if not already installed
echo "Installing git..."
sudo yum install -y git

# Install PM2 globally for process management
echo "Installing PM2 process manager..."
sudo npm install -g pm2

# Setup backend
echo "Setting up backend..."
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
npm install
# Set proper permissions for uploads folder
mkdir -p uploads
chmod 755 uploads

# Start backend with PM2
echo "Starting backend server with PM2..."
pm2 start index.js --name "slgaming-api"

# Setup frontend
echo "Setting up frontend..."
cd /home/ec2-user/SLGamingHub/SlGamingHub-frontend
npm install
npm run build

# Install and configure Nginx
echo "Installing and configuring Nginx..."
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/slgaminghub.conf <<EOL
server {
    listen 80;
    server_name 16.170.236.106;

    # Frontend
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy - Fixed to remove /api from proxy_pass
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Upload directory for static files
    location /uploads {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads;
    }
}
EOL

# Remove default Nginx configuration if it exists
sudo rm -f /etc/nginx/conf.d/default.conf

# Restart Nginx to apply changes
sudo systemctl restart nginx

# Set PM2 to start on boot
echo "Configuring PM2 to start on system boot..."
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

echo "Deployment completed successfully!"
echo "Your application should now be accessible at http://16.170.236.106"
