# 🚀 VPS Deployment Guide - Event Booking System

This guide provides step-by-step instructions for deploying your Event Booking System to a VPS using Docker.

## 📦 What You'll Deploy

Your application consists of:
- **Frontend**: React application with Nginx
- **Backend**: NestJS API server
- **Database**: PostgreSQL
- **Cache**: Redis
- **Reverse Proxy**: Nginx (optional)

## 🛠️ Step 1: Build Docker Images Locally

On your development machine:

```bash
# Navigate to your project directory
cd event-management-app

# Build Docker images and create tar files for transfer
./build-docker.sh

# This creates:
# - event-booking-system-backend-latest.tar.gz
# - event-booking-system-frontend-latest.tar.gz
```

## 📁 Step 2: Prepare Files for Transfer

Create a deployment package with these files:
```
deployment-package/
├── docker-compose.prod.yml
├── .env.production (rename to .env)
├── deploy.sh
├── scripts/
│   └── init-db.sql
├── event-booking-system-backend-latest.tar.gz
└── event-booking-system-frontend-latest.tar.gz
```

## 🖥️ Step 3: Prepare Your VPS

### Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

### Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (if using SSL)
sudo ufw enable
```

## 📤 Step 4: Transfer Files to VPS

```bash
# Create deployment directory on VPS
ssh user@your-vps-ip "mkdir -p ~/event-booking-system"

# Transfer files (replace with your actual VPS details)
scp -r deployment-package/* user@your-vps-ip:~/event-booking-system/

# SSH into VPS
ssh user@your-vps-ip
cd ~/event-booking-system
```

## 🐳 Step 5: Load Docker Images

```bash
# Load the Docker images from tar files
docker load < event-booking-system-backend-latest.tar.gz
docker load < event-booking-system-frontend-latest.tar.gz

# Verify images are loaded
docker images | grep event-booking-system
```

## ⚙️ Step 6: Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env
```

### Critical Environment Variables to Update:

```env
# Database Security
DB_PASSWORD=your_very_secure_database_password_here

# Redis Security  
REDIS_PASSWORD=your_very_secure_redis_password_here

# JWT Security (CRITICAL - Generate a strong 32+ character secret)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_here
COOKIE_SECRET=your_secure_cookie_secret_here

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecureAdminPassword123!

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs (Update with your domain or IP)
FRONTEND_URL=http://your-vps-ip
BACKEND_URL=http://your-vps-ip:3000
VITE_API_URL=http://your-vps-ip:3000/api
```

## 🚀 Step 7: Deploy the Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run full deployment
./deploy.sh deploy
```

This will:
1. Start all services (PostgreSQL, Redis, Backend, Frontend)
2. Run database migrations
3. Seed the database with initial data
4. Perform health checks

## 🔍 Step 8: Verify Deployment

### Check Service Status
```bash
./deploy.sh status
```

### Access Your Application
- **Frontend**: http://your-vps-ip
- **Backend API**: http://your-vps-ip:3000/api
- **API Docs**: http://your-vps-ip:3000/api/docs

### Test Health Endpoints
```bash
# Backend health
curl http://your-vps-ip:3000/api/health

# Frontend health
curl http://your-vps-ip/health
```

## 📊 Management Commands

```bash
# View logs
./deploy.sh logs                # All services
./deploy.sh logs backend        # Backend only
./deploy.sh logs frontend       # Frontend only

# Service management
./deploy.sh start              # Start services
./deploy.sh stop               # Stop services
./deploy.sh restart            # Restart services

# Database operations
./deploy.sh migrate            # Run migrations
./deploy.sh seed               # Seed database
./deploy.sh backup             # Backup database

# Maintenance
./deploy.sh health             # Health check
./deploy.sh cleanup            # Clean unused resources
```

## 🔒 Security Hardening

### 1. Enable SSL (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

### 2. Update Environment for HTTPS
```env
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com:3000
VITE_API_URL=https://yourdomain.com:3000/api
```

### 3. Regular Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images (when new versions are available)
./deploy.sh stop
# Transfer new image files and load them
./deploy.sh start
```

## 🔧 Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check logs
   ./deploy.sh logs
   
   # Check Docker status
   docker ps -a
   ```

2. **Database connection errors**
   ```bash
   # Check PostgreSQL logs
   ./deploy.sh logs postgres
   
   # Verify environment variables
   cat .env | grep DB_
   ```

3. **Frontend not loading**
   ```bash
   # Check frontend logs
   ./deploy.sh logs frontend
   
   # Verify backend is accessible
   curl http://localhost:3000/api/health
   ```

### Reset Everything
```bash
# Complete reset (WARNING: This deletes all data)
./deploy.sh stop
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a -f
./deploy.sh deploy
```

## 📈 Performance Optimization

### Monitor Resource Usage
```bash
# Check Docker container stats
docker stats

# Check system resources
htop
df -h
```

### Database Optimization
```bash
# Optimize PostgreSQL
./deploy.sh logs postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d event_booking -c "VACUUM ANALYZE;"
```

## 🆘 Support Checklist

If you encounter issues:

- [ ] Check all services are running: `./deploy.sh status`
- [ ] Review logs: `./deploy.sh logs`
- [ ] Verify environment variables in `.env`
- [ ] Check firewall settings: `sudo ufw status`
- [ ] Test network connectivity: `curl http://localhost:3000/api/health`
- [ ] Check disk space: `df -h`
- [ ] Check memory usage: `free -h`

## 🎉 Success!

Once deployed successfully, you'll have:
- ✅ Secure, production-ready application
- ✅ Automated database migrations
- ✅ Health monitoring
- ✅ Easy management scripts
- ✅ Scalable Docker architecture

Your Event Booking System is now live and ready for use!
