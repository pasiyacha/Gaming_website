# SL Gaming Hub - EC2 Deployment Guide

This guide provides instructions for deploying the SL Gaming Hub application to an AWS EC2 instance running Amazon Linux.

## Prerequisites

- An AWS EC2 instance with Amazon Linux 2023
- Instance public IP: 16.170.236.106
- Security group with the following ports open:
  - Port 22 (SSH) for administration
  - Port 80 (HTTP) for frontend access
  - Port 5000 for API access (if accessing API directly)

## Deployment Steps

### 1. Connect to your EC2 instance

```bash
ssh -i your-key.pem ec2-user@16.170.236.106
```

### 2. Clone the repository

```bash
cd ~
git clone https://github.com/PabodhaDiviyajaliGamage/Gaming_website.git SLGamingHub
```

### 3. Run the deployment script

First, we need to modify the deployment script for Amazon Linux:

```bash
cd SLGamingHub
vi deploy-ec2.sh
```

Update the script and make it executable:

```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

The deployment script will:
- Update the system
- Install Node.js, npm, and PM2
- Install and configure the backend
- Build the frontend
- Configure Nginx as a reverse proxy
- Set up PM2 to start the backend on system boot

### 4. Monitor the application

You can monitor the backend process using PM2:

```bash
pm2 status
pm2 logs slgaming-api
```

## Troubleshooting

### API Connection Issues

If the frontend cannot connect to the backend:

1. Check that the backend is running:
   ```bash
   pm2 status
   ```

2. Verify Nginx configuration:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. Check the backend logs:
   ```bash
   pm2 logs slgaming-api
   ```

4. Check if ports are properly opened in the security group and instance firewall:
   ```bash
   # Check if port 5000 is listening
   sudo netstat -tulpn | grep 5000
   
   # Check firewall status (if enabled)
   sudo systemctl status firewalld
   ```

### MongoDB Connection Issues

If the application cannot connect to MongoDB:

1. Check the `.env` file in the backend directory to ensure the MongoDB connection string is correct
2. Ensure that your MongoDB instance allows connections from your EC2 IP address
3. Test the MongoDB connection:
   ```bash
   # Install MongoDB shell if needed
   sudo yum install mongodb-org-shell -y
   
   # Test connection (replace with your connection string)
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/dbname"
   ```

## Additional Notes

- The application uses environment variables for configuration
- Frontend API URL is configured to point to `http://16.170.236.106:5000/api`
- CORS is configured to allow connections from specified origins
- Amazon Linux differences from Ubuntu:
  - Package manager is `yum` instead of `apt`
  - Nginx is installed via `amazon-linux-extras`
  - User is `ec2-user` instead of `ubuntu`
  - Configuration files may be in different locations

## Amazon Linux Specific Commands

Here are some commonly used commands specific to Amazon Linux:

```bash
# Update system
sudo yum update -y

# Install software
sudo yum install -y [package-name]

# Check service status
sudo systemctl status nginx

# Start a service
sudo systemctl start nginx

# Enable a service to start on boot
sudo systemctl enable nginx

# View logs
sudo journalctl -u nginx
```

## Security Considerations

For a production environment, consider:

1. Setting up HTTPS using Let's Encrypt:
   ```bash
   # Install certbot
   sudo amazon-linux-extras install epel -y
   sudo yum install -y certbot python3-certbot-nginx
   
   # Obtain certificate (replace with your actual domain if you have one)
   sudo certbot --nginx -d 16.170.236.106
   ```

2. Using environment variables for sensitive information
3. Implementing rate limiting for API endpoints
4. Regularly updating dependencies

## Backup and Maintenance

1. Regularly backup your MongoDB database
2. Keep the system updated with security patches:
   ```bash
   sudo yum update -y
   ```
3. Monitor the application logs for errors or suspicious activity:
   ```bash
   pm2 logs
   sudo tail -f /var/log/nginx/error.log
   ```
4. Set up automated backups and snapshots of your EC2 instance

## Alternative Installation Methods

### Using Docker (if you prefer containerization)

1. Install Docker on Amazon Linux:
   ```bash
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   # Log out and log back in
   ```

2. Build and run Docker containers for your application (requires creating Dockerfile and docker-compose.yml)

### Additional Resources

- [Amazon Linux 2023 User Guide](https://docs.aws.amazon.com/linux/al2023/ug/what-is-amazon-linux.html)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
