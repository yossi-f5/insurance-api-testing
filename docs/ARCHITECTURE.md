# Architecture & Deployment Guide

This project uses a **single `docker-compose.yml`** for both local and production deployments. This document explains the architecture, the role of each container, and how to run everything.

---

## Project Structure Overview

```
docker-compose.yml          # Single compose file (3 containers)
deploy.sh                   # Deploy helper script

frontend/
├── Dockerfile              # Multi-stage: builds React app + serves via nginx
├── nginx-simple.conf       # nginx config: serves frontend + proxies API + detailed logging

backend/
├── Dockerfile              # Node.js API server

scripts/
├── traffic_simulator.js    # Automated traffic generator
├── Dockerfile              # Container for the traffic simulator

aws/
├── ec2-setup.sh            # Provisions an EC2 instance
├── user-data.sh            # Bootstraps Docker on EC2 and starts the app
├── task-definition.json    # ECS Fargate task definition
```

---

## Running the Application

### Quick Start

```bash
docker-compose up --build -d
```

### Containers

| Container           | Built From            | Port    | Role                                             |
|---------------------|-----------------------|---------|--------------------------------------------------|
| `frontend`          | `frontend/Dockerfile` | `:80`   | Builds React app + serves it via nginx + proxies API |
| `backend`           | `backend/Dockerfile`  | `:3001` | Node.js API server                               |
| `traffic-simulator` | `scripts/Dockerfile`  | none    | Generates automated test traffic                 |

### How It Works

- `frontend/Dockerfile` is a **multi-stage build**:
  1. **Stage 1 (node):** Runs `npm run build` to produce static files in `/app/dist`
  2. **Stage 2 (nginx):** Copies the built files into `nginx:alpine` and uses `frontend/nginx-simple.conf`
- The frontend nginx serves static files on port 80, proxies `/api/` requests to `backend:3001`, and logs requests with detailed client IP information
- The traffic simulator generates automated API requests for testing

### Access Points

| URL                          | Description |
|------------------------------|-------------|
| `http://localhost`           | Frontend UI |
| `http://localhost:3001/api/` | Backend API |

### Demo Credentials

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin1   | adminpass |
| User  | user1    | userpass  |

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build -d
```

---

## 4. AWS Deployment

The `aws/` folder contains scripts and configs for deploying to AWS.

### Option A: EC2 Instance

1. **Edit placeholders** in `aws/ec2-setup.sh` and `aws/user-data.sh`:
   - Replace `yourusername/` with your Docker Hub or ECR image prefix
   - Replace `yourdomain.com` with your actual domain
   - Replace `your-key-pair` with your EC2 key pair name

2. **Push images to a registry** (Docker Hub or ECR):
   ```bash
   # Build images
   docker-compose build

   # Tag for ECR (example)
   docker tag insurance-api-testing-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/insurance-frontend:latest
   docker tag insurance-api-testing-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/insurance-backend:latest

   # Push
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/insurance-frontend:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/insurance-backend:latest
   ```

3. **Run the setup script:**
   ```bash
   ./aws/ec2-setup.sh yourdomain.com us-east-1 t3.micro your-key-pair
   ```

   This will:
   - Create a security group (ports 22, 80, 443)
   - Launch an EC2 instance
   - Run `user-data.sh` on boot, which installs Docker and starts the app
   - Output the public IP address

4. **Point your DNS** to the EC2 public IP

### Option B: ECS Fargate

1. **Edit placeholders** in `aws/task-definition.json`:
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Replace `yourusername/` with your ECR image URIs
   - Replace `yourdomain.com` with your domain

2. **Push images to ECR** (same as above)

3. **Register the task definition:**
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/task-definition.json
   ```

4. **Create an ECS service** using the registered task definition with an Application Load Balancer

### Containers in AWS

The Fargate task definition defines two containers:
- `frontend` (port 80) — nginx serving frontend + proxying to backend
- `backend` (port 3001) — Node.js API

---

## Architecture Diagram

```
Browser → :80 [frontend container (nginx)]
                ├── / → serves static React files
                └── /api/ → proxy to backend:3001
          :3001 [backend container (node)]
          [traffic-simulator container] → generates test requests
```
