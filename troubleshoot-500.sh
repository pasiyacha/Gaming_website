#!/bin/bash

# Troubleshooting script for 500 Internal Server Error
# Run this on your EC2 instance to diagnose and fix common issues

echo "======= SL Gaming Hub Troubleshooting Script ======="
echo "Checking for common issues that might cause 500 Internal Server Error"
echo

# Check if backend is running
echo "1. Checking if backend service is running..."
pm2_status=$(pm2 status 2>&1)
if echo "$pm2_status" | grep -q "slgaming-api"; then
  echo "✓ Backend service is running with PM2"
  
  # Check if the backend has errors
  echo "   Checking backend logs for errors..."
  recent_errors=$(pm2 logs slgaming-api --lines 50 --nostream 2>&1 | grep -i "error\|exception\|fatal")
  if [ -n "$recent_errors" ]; then
    echo "✗ Found errors in backend logs:"
    echo "$recent_errors"
  else
    echo "✓ No obvious errors found in recent backend logs"
  fi
else
  echo "✗ Backend service is not running with PM2"
  echo "   Starting backend service..."
  cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
  pm2 start index.js --name "slgaming-api"
fi

# Check if Node.js is installed and its version
echo
echo "2. Checking Node.js installation..."
node_version=$(node -v 2>&1)
if [[ $node_version == v* ]]; then
  echo "✓ Node.js is installed: $node_version"
else
  echo "✗ Node.js is not properly installed"
fi

# Check MongoDB connection
echo
echo "3. Testing MongoDB connection..."
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
mongo_test=$(node -e "
const mongoose = require('mongoose');
require('dotenv').config();
console.log('Attempting to connect to MongoDB: ' + process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
" 2>&1)

echo "$mongo_test"

# Check if .env file exists and has required variables
echo
echo "4. Checking environment variables..."
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
if [ -f ".env" ]; then
  echo "✓ .env file exists"
  
  # Check for required variables
  required_vars=("MONGO_URL" "JWT_SECRET" "PORT")
  for var in "${required_vars[@]}"; do
    if grep -q "$var=" .env; then
      echo "✓ $var is defined"
    else
      echo "✗ $var is missing in .env file"
    fi
  done
else
  echo "✗ .env file is missing"
  
  # Create basic .env file
  echo "   Creating basic .env file..."
  cat > .env << EOF
MONGO_URL="mongodb+srv://shanu:123@interview1.44lcazh.mongodb.net/?retryWrites=true&w=majority&appName=Interview1"
JWT_SECRET=secreat
PORT=5000

# Node environment
NODE_ENV=production

# CORS settings for EC2 deployment
CORS_ORIGINS=http://16.170.236.106,http://localhost:5173
EOF
  echo "   Basic .env file created"
fi

# Check Nginx configuration
echo
echo "5. Checking Nginx configuration..."
nginx_conf_test=$(sudo nginx -t 2>&1)
if echo "$nginx_conf_test" | grep -q "successful"; then
  echo "✓ Nginx configuration test successful"
else
  echo "✗ Nginx configuration test failed:"
  echo "$nginx_conf_test"
fi

# Check if Nginx is routing properly
echo
echo "6. Checking Nginx routing..."
if sudo cat /etc/nginx/conf.d/slgaminghub.conf &>/dev/null; then
  echo "✓ Nginx configuration file exists"
  
  # Check if location blocks are properly configured
  api_location=$(sudo cat /etc/nginx/conf.d/slgaminghub.conf | grep -A 10 "location /api")
  if [ -n "$api_location" ]; then
    echo "✓ API location block found in Nginx config"
  else
    echo "✗ API location block missing in Nginx config"
    echo "   Creating proper Nginx configuration..."
    sudo tee /etc/nginx/conf.d/slgaminghub.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 16.170.236.106;

    # Frontend
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload directory for static files
    location /uploads {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads;
    }
}
EOF
    sudo systemctl restart nginx
    echo "   Nginx configuration updated and service restarted"
  fi
else
  echo "✗ Nginx configuration file missing"
  echo "   Creating Nginx configuration..."
  sudo tee /etc/nginx/conf.d/slgaminghub.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 16.170.236.106;

    # Frontend
    location / {
        root /home/ec2-user/SLGamingHub/SlGamingHub-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload directory for static files
    location /uploads {
        alias /home/ec2-user/SLGamingHub/SlGamingHub-backend/uploads;
    }
}
EOF
  sudo systemctl restart nginx
  echo "   Nginx configuration created and service restarted"
fi

# Check system resources
echo
echo "7. Checking system resources..."
echo "   Memory usage:"
free -h
echo
echo "   Disk space:"
df -h | grep /dev/xvda
echo

# Check if backend port is actually listening
echo
echo "8. Checking if backend port is listening..."
port_check=$(sudo netstat -tulpn | grep :5000)
if [ -n "$port_check" ]; then
  echo "✓ Port 5000 is listening"
  echo "   $port_check"
else
  echo "✗ Port 5000 is not listening"
  echo "   Attempting to restart backend..."
  cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
  pm2 restart slgaming-api || pm2 start index.js --name "slgaming-api"
fi

# Fix permissions if needed
echo
echo "9. Fixing potential permission issues..."
cd /home/ec2-user/SLGamingHub
sudo chown -R ec2-user:ec2-user .
cd SlGamingHub-backend
mkdir -p uploads
chmod 755 uploads

echo
echo "======= Troubleshooting Complete ======="
echo "Next steps:"
echo "1. Check the detailed logs: 'pm2 logs slgaming-api'"
echo "2. Test the API directly: 'curl http://localhost:5000/api/test'"
echo "3. Restart all services: 'pm2 restart all && sudo systemctl restart nginx'"
echo "4. If errors persist, manual backend debugging may be required"
echo
