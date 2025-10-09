# Event Booking System - Docker Deployment Guide

This guide will help you deploy the Event Booking System to your VPS using Docker.

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- At least 2GB RAM and 20GB storage
- Domain name (optional, for SSL)

## 🚀 Quick Deployment

### 1. Prepare Your VPS

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

# Logout and login again to apply Docker group changes
```

### 2. Transfer Files to VPS

Copy the following files to your VPS:
- `docker-compose.prod.yml`
- `.env.production` (rename to `.env`)
- `apps/` directory (entire folder)
- `libs/` directory (entire folder)
- `scripts/` directory (entire folder)
- `package.json`
- `yarn.lock`
- `nx.json`
- `tsconfig.base.json`
- `deploy.sh`
- `.dockerignore`

### 3. Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Important Environment Variables to Update:**

```env
# Database
DB_PASSWORD=your_secure_db_password_here

# Redis
REDIS_PASSWORD=your_secure_redis_password_here

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
COOKIE_SECRET=your_secure_cookie_secret_here

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecureAdminPassword123!

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs (update with your domain)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

### 4. Deploy the Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run full deployment
./deploy.sh deploy
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Wait for services to start (30 seconds)
sleep 30

# 4. Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run typeorm:run

# 5. Seed database
docker-compose -f docker-compose.prod.yml exec backend npm run seed

# 6. Check status
docker-compose -f docker-compose.prod.yml ps
```

## 📊 Management Commands

### Service Management
```bash
# Start services
./deploy.sh start

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Check status
./deploy.sh status
```

### Monitoring
```bash
# View all logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs postgres

# Health check
./deploy.sh health
```

### Database Management
```bash
# Run migrations
./deploy.sh migrate

# Seed database
./deploy.sh seed

# Backup database
./deploy.sh backup
```

### Maintenance
```bash
# Clean up unused Docker resources
./deploy.sh cleanup

# Rebuild and redeploy
./deploy.sh stop
./deploy.sh build
./deploy.sh start
```

## 🌐 Access Your Application

After successful deployment:

- **Frontend**: http://your-server-ip
- **Backend API**: http://your-server-ip:3000/api
- **API Documentation**: http://your-server-ip:3000/api/docs (if enabled)

## 🔒 Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL Certificate (Recommended)
Use Let's Encrypt with Nginx reverse proxy:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 3. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
./deploy.sh restart
```

## 🔍 Troubleshooting

### Check Service Health
```bash
# Check if all containers are running
docker-compose -f docker-compose.prod.yml ps

# Check container logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check resource usage
docker stats
```

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL container is running
   - Verify database credentials in .env file
   - Check network connectivity between containers

2. **Frontend Not Loading**
   - Check if frontend container is running
   - Verify nginx configuration
   - Check if backend API is accessible

3. **Backend API Errors**
   - Check backend logs for errors
   - Verify environment variables
   - Check database migrations

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove all images
docker rmi $(docker images -q)

# Start fresh deployment
./deploy.sh deploy
```

## 📈 Performance Optimization

### 1. Resource Limits
Add resource limits to docker-compose.prod.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 2. Database Optimization
```bash
# Optimize PostgreSQL configuration
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d event_booking -c "VACUUM ANALYZE;"
```

### 3. Log Rotation
```bash
# Configure Docker log rotation
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `./deploy.sh logs`
2. Verify environment configuration
3. Check Docker and system resources
4. Review this documentation

For additional help, check the application logs and Docker documentation.
