# Insurance API Security Testing App

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security Testing](https://img.shields.io/badge/Security-Testing-red)](https://owasp.org/www-project-api-security-top-10/)
[![F5 XC Ready](https://img.shields.io/badge/F5%20XC-Ready-green)](https://www.f5.com/cloud/products/application-services)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/refaelach/insurance-api-testing)

A demo application for security testing of common API vulnerabilities, including OWASP API Security Top 10. Built with React and Node.js, with support for running either through Docker with NGINX or directly with Express/Node without Docker or NGINX.

## 🎯 Purpose

This project provides a **realistic insurance application** with **intentional vulnerabilities** for:
- API security testing and training
- Load balancer configuration testing (F5 XC, etc.)
- Security tool evaluation
- Penetration testing practice

## 🔐 Features

### Authentication & Security
- **JWT-based Authentication**: Real backend authentication with token management
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Role-based Access**: Admin and regular user roles
- **Token Management**: Secure JWT token storage and validation

### Vulnerable Endpoints (For Testing)
- **BUA (Broken User Authentication)**: `/api/customers/me` - JWT bypass
- **SSRF (Server-Side Request Forgery)**: `/api/documents/preview` - URL fetching
- **Verbose Error Messages**: Detailed error responses for testing
- **Weak Authentication**: Multiple weak password accounts
- **Missing Rate Limiting**: Endpoints without rate limiting
- **Insecure Direct Object References**: Direct ID access

### Realistic Application
- **Insurance Portal**: Complete frontend with policies, claims, documents
- **Admin Panel**: Administrative functions and reporting
- **User Management**: Registration, profiles, preferences
- **Document Management**: File uploads and previews

### Production-like Architecture
- **NGINX Reverse Proxy**: Single entry point (port 80)
- **Docker Containerization**: Easy deployment and scaling
- **Traffic Simulation**: Automated realistic API traffic
- **Multi-cloud Ready**: Deployment scripts for major cloud providers

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   NGINX         │    │   Services      │
│   Browser       │───▶│   Reverse Proxy │───▶│   Frontend      │
│                 │    │   Port 80       │    │   Backend       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
/
├── frontend/             # React frontend (Vite)
├── backend/              # Express API with vulnerabilities
├── nginx/                # NGINX reverse proxy config
├── scripts/              # Traffic simulation & utilities
├── docs/                 # Documentation
├── aws/                  # AWS deployment configs
├── azure/                # Azure deployment configs
├── gcp/                  # Google Cloud deployment configs
├── digitalocean/         # DigitalOcean deployment configs
├── docker-compose.yml    # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Git
- Docker and Docker Compose for the containerized option
- Node.js 20+ and npm for the non-Docker option

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/yossi-f5/insurance-api-testing.git 
cd insurance-api-testing
```

### 2. Run Options

#### Option A: Run with Docker and NGINX
This starts the full stack with containers and exposes the app through NGINX on port 80.

```bash

# Build and start all services
docker-compose up --build
```

#### Option B: Run without Docker or NGINX
This runs the backend directly with Express and serves the built frontend with the Node/Express server in `frontend/server.js`.

```bash
# Terminal 1 - backend
cd backend
npm ci
npm start

# Terminal 2 - frontend
cd frontend
npm ci
npm run build
BACKEND_BASE_URL=http://localhost:3001 npm start
```

If you prefer, you can also use the Vite development server for frontend-only work:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:3001 npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost
- **API Health Check**: http://localhost/api/health
- **Admin Login**: `admin1` / `adminpass`
- **User Login**: `user1` / `userpass`

For the non-Docker option:
- **Frontend**: http://localhost:8080
- **Backend API Health Check**: http://localhost:3001/api/health
- **Frontend health endpoint**: http://localhost:8080/health

### 4. Test Vulnerabilities
- **BOLA**: Try accessing `/api/customers/me` without proper JWT
- **SSRF**: Use `/api/documents/preview` with external URLs
- **Weak Auth**: Try common passwords on weak accounts
- **Verbose Errors**: Trigger errors to see detailed responses

## 🔧 Configuration

### Environment Variables
Create a `.env` file for customization:
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-security-testing-2024

# Traffic Simulation
TRAFFIC_BASE_URL=http://nginx
SIMULATION_DURATION=5
CONCURRENT_USERS=8
MAX_REQUESTS_PER_USER=30

# Backend Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://localhost,http://localhost:80,http://nginx:80
```

### Traffic Simulation
The app includes automated traffic simulation for API discovery:
- **Frequency**: Every 2 minutes
- **Duration**: 5 minutes per run
- **Requests**: ~2,640 requests per simulation
- **Users**: 8 concurrent users with realistic authentication

## 🐳 Docker Commands

The Docker option uses NGINX as the main entry point. If you want to run without Docker or without NGINX, use the non-Docker startup commands in Quick Start instead.

```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build frontend
```

## ☁️ Cloud Deployment

### Quick Deploy Scripts
```bash
# AWS ECS
./scripts/deploy-aws.sh

# Azure Container Instances
./scripts/deploy-azure.sh

# Google Cloud Run
./scripts/deploy-gcp.sh

# DigitalOcean App Platform
./scripts/deploy-digitalocean.sh
```

### Manual Deployment
See `docs/CLOUD_DEPLOYMENT_GUIDE.md` for detailed instructions on:
- AWS ECS/EC2 deployment
- Azure Container Instances/App Service
- Google Cloud Run/Compute Engine
- DigitalOcean App Platform/Droplet
- Custom domain configuration
- SSL certificate setup

## 🧪 Security Testing

### Available Vulnerabilities
1. **Authentication Bypass**: Weak JWT validation
2. **Authorization Flaws**: Missing role checks
3. **Input Validation**: SSRF in document preview
4. **Error Handling**: Verbose error messages
5. **Rate Limiting**: Missing on vulnerable endpoints
6. **Data Exposure**: Sensitive data in responses

### Testing Tools Integration
- **F5 XC Load Balancer**: API discovery and monitoring
- **OWASP ZAP**: Automated vulnerability scanning
- **Burp Suite**: Manual security testing
- **Postman**: API testing and automation

## 📚 Documentation

- **API Documentation**: See `docs/API_CALLS_REVIEW.md`
- **Cloud Deployment**: See `docs/CLOUD_DEPLOYMENT_GUIDE.md`
- **CORS Configuration**: See `docs/CORS_TROUBLESHOOTING.md`
- **Docker Setup**: See `docs/DOCKER_SUMMARY.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

**This application contains intentional vulnerabilities for security testing purposes. Do not deploy to production environments or expose to the public internet without proper security measures.**

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `docs/` directory
- **Security**: Report security issues privately

---

**Built for security testing and education purposes** 🔒
