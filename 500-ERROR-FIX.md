# 500 Internal Server Error Troubleshooting Guide

If you're experiencing 500 Internal Server Error when accessing your SL Gaming Hub application deployed on EC2, follow these troubleshooting steps:

## Quick Fixes

1. **Run the troubleshooting script**:
   Upload the `troubleshoot-500.sh` script to your EC2 instance and run it:
   ```bash
   chmod +x troubleshoot-500.sh
   ./troubleshoot-500.sh
   ```

2. **Fix Nginx configuration** (Most common issue):
   ```bash
   # Edit the Nginx configuration
   sudo nano /etc/nginx/conf.d/slgaminghub.conf
   ```
   
   Change this line:
   ```
   proxy_pass http://localhost:5000/api;
   ```
   
   To:
   ```
   proxy_pass http://localhost:5000;
   ```
   
   Then restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

3. **Restart services**:
   ```bash
   # Restart backend
   pm2 restart slgaming-api
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

## Detailed Troubleshooting

### 1. Check Backend Logs

```bash
# View backend logs
pm2 logs slgaming-api --lines 100
```

Common errors to look for:
- MongoDB connection issues
- Missing environment variables
- API route errors

### 2. Check if Backend is Running

```bash
# Check PM2 processes
pm2 status

# Check if port 5000 is listening
sudo netstat -tulpn | grep :5000
```

### 3. Test API Directly

```bash
# Test the API directly (bypassing Nginx)
curl http://localhost:5000/api/test

# If that works, test with Nginx
curl http://localhost/api/test
```

### 4. Verify Environment Variables

```bash
# Check backend .env file
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
cat .env

# Make sure it contains required variables:
# - MONGO_URL
# - JWT_SECRET
# - PORT
```

### 5. Check Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### 6. Check Filesystem Permissions

```bash
# Ensure proper ownership
sudo chown -R ec2-user:ec2-user /home/ec2-user/SLGamingHub

# Ensure uploads directory exists and has proper permissions
cd /home/ec2-user/SLGamingHub/SlGamingHub-backend
mkdir -p uploads
chmod 755 uploads
```

## Additional Tips

- **Database Connection**: Ensure MongoDB Atlas allows connections from your EC2 IP
- **Memory Issues**: Check if your instance has enough memory
  ```bash
  free -h
  ```
- **Firewall Settings**: Check if any local firewall is blocking connections
  ```bash
  sudo systemctl status firewalld
  ```

If you've tried all the above and still have issues, create a debug route in your backend to help diagnose:

```javascript
// Add this to your index.js file
app.get("/debug", (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    mongoConnected: mongoose.connection.readyState === 1,
    time: new Date().toISOString(),
    routes: app._router.stack.filter(r => r.route).map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods)
    }))
  });
});
```
