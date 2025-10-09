# 🚀 Local Development & Docker Setup Guide

This guide will help you run the Event Booking System locally using Docker and create production-ready images for VPS deployment.

## 📋 Prerequisites

- Docker Desktop installed and running
- Git (for version control)
- At least 4GB RAM available for Docker

## 🛠️ Quick Start - Local Development

### Step 1: Setup Local Environment

```bash
# Navigate to your project directory
cd event-management-app

# Setup and start everything
./dev-local.sh setup
```

This command will:
1. ✅ Check Docker prerequisites
2. ✅ Create `.env` file from local template
3. ✅ Build Docker images with Node 20
4. ✅ Start all services (PostgreSQL, Redis, Backend, Frontend)
5. ✅ Run database migrations
6. ✅ Seed database with initial data
7. ✅ Perform health checks

### Step 2: Access Your Application

After successful setup:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs
- **Database**: localhost:5432 (postgres/password)
- **Redis**: localhost:6379

## 🔧 Development Commands

```bash
# View service status
./dev-local.sh status

# View logs
./dev-local.sh logs           # All services
./dev-local.sh logs backend   # Backend only
./dev-local.sh logs frontend  # Frontend only

# Service management
./dev-local.sh start          # Start services
./dev-local.sh stop           # Stop services
./dev-local.sh restart        # Restart services

# Database operations
./dev-local.sh migrate        # Run migrations
./dev-local.sh seed           # Seed database

# Health check
./dev-local.sh health

# Clean everything (removes all data)
./dev-local.sh cleanup
```

## 📦 Create Production Images

### Step 1: Save Images for VPS Deployment

```bash
# Save Docker images as tar.gz files
./dev-local.sh save
```

This creates:
- `event-booking-system-backend-latest.tar.gz`
- `event-booking-system-frontend-latest.tar.gz`

### Step 2: Prepare Production Environment File

```bash
# Copy production template
cp .env.production .env.prod

# Edit for your production environment
# Update database passwords, JWT secrets, domain URLs, etc.
```

## 🌐 VPS Deployment Package

Create a deployment folder with these files:

```
vps-deployment/
├── docker-compose.prod.yml
├── .env.prod (your configured production environment)
├── deploy.sh
├── scripts/
│   └── init-db.sql
├── event-booking-system-backend-latest.tar.gz
└── event-booking-system-frontend-latest.tar.gz
```

## 🚀 Deploy to VPS

### Step 1: Transfer Files to VPS

```bash
# Transfer deployment package to VPS
scp -r vps-deployment/* user@your-vps-ip:~/event-booking-system/
```

### Step 2: Deploy on VPS

```bash
# SSH into VPS
ssh user@your-vps-ip
cd ~/event-booking-system

# Load Docker images
docker load < event-booking-system-backend-latest.tar.gz
docker load < event-booking-system-frontend-latest.tar.gz

# Configure environment
mv .env.prod .env
nano .env  # Final adjustments if needed

# Deploy
chmod +x deploy.sh
./deploy.sh deploy
```

## 🔍 Troubleshooting

### Common Issues

1. **Docker Build Fails**
   ```bash
   # Clean Docker cache and rebuild
   docker system prune -a -f
   ./dev-local.sh build
   ```

2. **Services Won't Start**
   ```bash
   # Check logs
   ./dev-local.sh logs
   
   # Check Docker resources
   docker system df
   ```

3. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   ./dev-local.sh logs postgres
   
   # Restart database
   docker-compose -f docker-compose.local.yml restart postgres
   ```

4. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :4200
   netstat -tulpn | grep :5432
   
   # Stop conflicting services or change ports in .env
   ```

### Reset Everything

```bash
# Complete reset (removes all data)
./dev-local.sh cleanup

# Start fresh
./dev-local.sh setup
```

## ⚙️ Environment Configuration

### Local Development (.env)

Key settings for local development:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PASSWORD=password
JWT_SECRET=your_local_development_jwt_secret_key_minimum_32_characters
ADMIN_EMAIL=admin@localhost.com
ADMIN_PASSWORD=Admin123!
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
ENABLE_SWAGGER=true
```

### Production (.env.prod)

Critical settings for production:
```env
NODE_ENV=production
DB_PASSWORD=your_very_secure_database_password
REDIS_PASSWORD=your_very_secure_redis_password
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecureAdminPassword123!
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com:3000
VITE_API_URL=https://yourdomain.com:3000/api
ENABLE_SWAGGER=false
```

## 📊 Monitoring

### Check Application Health

```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend health  
curl http://localhost:4200/health

# Database connection
docker-compose -f docker-compose.local.yml exec postgres pg_isready -U postgres
```

### View Resource Usage

```bash
# Docker container stats
docker stats

# Disk usage
docker system df
```

## 🎯 Development Workflow

1. **Start Development**
   ```bash
   ./dev-local.sh setup
   ```

2. **Make Code Changes**
   - Edit files in `apps/backend/` or `apps/frontend/`
   - Changes require rebuild for Docker environment

3. **Rebuild After Changes**
   ```bash
   ./dev-local.sh stop
   ./dev-local.sh build
   ./dev-local.sh start
   ```

4. **Test Changes**
   ```bash
   ./dev-local.sh health
   ```

5. **Create Production Images**
   ```bash
   ./dev-local.sh save
   ```

## ✅ Success Checklist

After running `./dev-local.sh setup`, verify:

- [ ] All services are running: `./dev-local.sh status`
- [ ] Frontend loads: http://localhost:4200
- [ ] Backend API responds: http://localhost:3000/api/health
- [ ] API docs available: http://localhost:3000/api/docs
- [ ] Database is accessible
- [ ] No error logs: `./dev-local.sh logs`

You're now ready for local development and can create production images for VPS deployment!
