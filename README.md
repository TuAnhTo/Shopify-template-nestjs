# Shopify Microservice Application

A production-ready Shopify app built with microservices architecture, featuring session token authentication, server-side rendering, and Kubernetes deployment.

## 🏗️ Architecture Overview

### 🔐 **Authentication Flow**

This application implements modern Shopify authentication with JWT session tokens and automatic token exchange:

1. **Shopify sends JWT session token** to gateway
2. **Gateway validates JWT signature** using SHOPIFY_API_SECRET
3. **Gateway checks for existing session** in database
4. **If no session exists**: Gateway performs **token exchange** with Shopify OAuth
5. **Session stored in database** with persistent access token
6. **Gateway forwards request** to App Service for static file serving

```
┌─────────────┐    JWT Token    ┌─────────────┐    Session Check    ┌─────────────┐
│   Shopify   │──────────────► │   Gateway   │───────────────────► │Auth Service │
│   Admin     │                │Port: 3003   │                     │Port: 3001   │
└─────────────┘                └─────────────┘                     └─────────────┘
                                       │                                    │
                                       │ No Session? │                     │
                                       ▼ Token Exchange                     ▼
                               ┌─────────────┐                     ┌─────────────┐
                               │OAuth API    │◄────────────────────│PostgreSQL   │
                               │Exchange     │  Store Session      │Sessions DB  │
                               └─────────────┘                     └─────────────┘
```

### Development Mode

```
┌─────────────────┐    ┌─────────────────┐
│   Shopify CLI   │────│   Frontend      │
│   Fixed Tunnel  │    │   React/Vite    │ ← Session tokens
│   Port: 3000    │    │   Port: 5173    │
└─────────────────┘    └─────────────────┘
          │                        │
          │     Shopify requests   │
          │     with JWT tokens    │
          ▼                        ▼
    ┌─────────────────────────────────────┐
    │        API Gateway                  │ ← JWT validation
    │        Port: 3003                   │   → Token exchange
    │        (K8s with port-forward)      │   → Route to services
    └─────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Auth Service │ │App Service  │ │PostgreSQL   │
│Port: 3001   │ │Port: 3000   │ │Port: 5432   │
│Session Mgmt │ │Static Files │ │Sessions DB  │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Production Mode

```
┌─────────────────┐    ┌─────────────────┐
│    Ingress      │────│   API Gateway   │
│    nginx        │    │   Port: 3003    │
└─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │Auth Service │ │App Service  │ │PostgreSQL   │
            │Port: 3001   │ │Port: 3000   │ │Port: 5432   │
            │JWT + OAuth  │ │Static Files │ │Sessions DB  │
            └─────────────┘ └─────────────┘ └─────────────┘
```

## 📋 Prerequisites

- **Docker Desktop** with Kubernetes enabled
- **kubectl** configured to access your cluster
- **Node.js** 18+ and **pnpm**
- **Shopify CLI** 3.80+
- **ngrok account** (for fixed tunnel development)
- **Shopify Partner Account** and test store

## 🚀 Quick Start Guide

### 1. Environment Setup

#### Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd microservice-app

# Install root dependencies
pnpm install

# Install service dependencies
cd web && pnpm install
cd auth && pnpm install
cd app && pnpm install
cd shopify && pnpm install
cd webhook && pnpm install
cd api-gateway && pnpm install
cd frontend && pnpm install
cd ..
```

#### Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit with your Shopify app credentials
nano .env
```

Required environment variables:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products
DB_PASSWORD=postgres_password
SHOPIFY_WEBHOOK_SECRET=webhook_secret
```

### 2. Development Workflow

#### Option A: Full Local Development (Recommended for Frontend Changes)

```bash
# Start all services locally
pnpm run dev:all

# In another terminal, start Shopify CLI
shopify app dev
```

#### Option B: Hybrid Development (K8s Backend + Shopify CLI Frontend) ⭐ **Recommended**

**Step 1: Prepare Development Configuration**

```bash
# Get your project root path
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Update development configuration with your project path
sed -i.bak "s|PROJECT_ROOT_PLACEHOLDER|$PROJECT_ROOT|g" k8s/overlays/development/development-config.yaml

# Verify the paths were updated correctly
grep -n "$PROJECT_ROOT" k8s/overlays/development/development-config.yaml
```

**Step 2: Build Development Images**

```bash
# Build all service images for development
docker build -t microservice-app/auth-service:dev-latest -f web/auth/Dockerfile web/
docker build -t microservice-app/app-service:dev-latest -f web/app/Dockerfile web/
docker build -t microservice-app/shopify-service:dev-latest -f web/shopify/Dockerfile web/
docker build -t microservice-app/webhook-service:dev-latest -f web/webhook/Dockerfile web/
docker build -t microservice-app/gateway-service:dev-latest -f web/api-gateway/Dockerfile web/
```

**Step 3: Deploy to Kubernetes**

```bash
# Create namespace
kubectl create namespace microservice-app

# Apply development configuration with hot reload
kubectl apply -k k8s/overlays/development

# Wait for all services to be ready
kubectl wait --for=condition=available --timeout=300s deployment -l app.kubernetes.io/name=microservice-app -n microservice-app

# Check deployment status
kubectl get pods -n microservice-app
```

**Step 4: Setup Port Forwarding**

```bash
# Port forward all backend services
kubectl port-forward svc/gateway-service 3001:3001 -n microservice-app &
kubectl port-forward svc/auth-service 3002:3002 -n microservice-app &
kubectl port-forward svc/app-service 3003:3003 -n microservice-app &
kubectl port-forward svc/shopify-service 3004:3004 -n microservice-app &
kubectl port-forward svc/webhook-service 3005:3005 -n microservice-app &
kubectl port-forward svc/postgres-service 5432:5432 -n microservice-app &

# Verify port forwarding is active
lsof -i :3001,3002,3003,3004,3005,5432 | grep kubectl
```

**Step 5: Setup Fixed Tunnel (Optional)**

```bash
# Install ngrok
brew install ngrok

# Authenticate ngrok
ngrok config add-authtoken <your-token>

# Start fixed tunnel
ngrok http 3000 --subdomain=your-app-name
```

**Step 6: Start Shopify CLI**

```bash
# With fixed tunnel
shopify app dev --tunnel-url=https://your-app-name.ngrok.io

# Or without tunnel (random URL each time)
shopify app dev
```

### 3. Building Docker Images

#### Build All Services

```bash
# Build auth service
docker build -t microservice-app/auth-service:latest -f web/auth/Dockerfile web/

# Build app service
docker build -t microservice-app/app-service:latest -f web/app/Dockerfile web/

# Build shopify service
docker build -t microservice-app/shopify-service:latest -f web/shopify/Dockerfile web/

# Build webhook service
docker build -t microservice-app/webhook-service:latest -f web/webhook/Dockerfile web/

# Build api gateway
docker build -t microservice-app/gateway-service:latest -f web/api-gateway/Dockerfile web/

# Build frontend (for production)
docker build -t microservice-app/frontend:latest -f web/frontend/Dockerfile web/
```

#### Build Development Images

```bash
# Build with dev tags
docker build -t microservice-app/auth-service:dev-latest -f web/auth/Dockerfile web/
docker build -t microservice-app/app-service:dev-latest -f web/app/Dockerfile web/
docker build -t microservice-app/shopify-service:dev-latest -f web/shopify/Dockerfile web/
docker build -t microservice-app/webhook-service:dev-latest -f web/webhook/Dockerfile web/
docker build -t microservice-app/gateway-service:dev-latest -f web/api-gateway/Dockerfile web/
```

## 🔧 Development Setup for Teams

This project uses `PROJECT_ROOT_PLACEHOLDER` in the Kubernetes configuration to make it easy for team members to work on different machines. Each developer needs to update the paths once for their local environment.

### Team Member Onboarding

```bash
# Clone repository
git clone <repository-url>
cd microservice-app

# Install dependencies (run this once)
pnpm install
cd web && pnpm install

# Update paths for your local environment
sed -i.bak "s|PROJECT_ROOT_PLACEHOLDER|$(pwd)|g" k8s/overlays/development/development-config.yaml

# Follow the development workflow steps above
```

## 🛠️ Kubernetes Deployment

### Development Deployment

```bash
# Apply development configuration
kubectl apply -k k8s/overlays/development

# Check deployment status
kubectl get pods -n microservice-app
kubectl get services -n microservice-app

# View logs
kubectl logs -f deployment/shopify-service -n microservice-app
kubectl logs -f deployment/auth-service -n microservice-app
kubectl logs -f deployment/app-service -n microservice-app
```

### Production Deployment

```bash
# Apply production configuration
kubectl apply -k k8s/overlays/production

# Wait for all services
kubectl wait --for=condition=available --timeout=600s deployment -l app.kubernetes.io/name=microservice-app -n microservice-app

# Check status
kubectl get pods -n microservice-app
kubectl get ingress -n microservice-app
```

## 🔧 Configuration Management

### Update ConfigMap

```bash
# Edit configuration
kubectl edit configmap app-config -n microservice-app

# Or apply changes
kubectl apply -f k8s/base/configmap.yaml
```

### Update Secrets

```bash
# Update Shopify credentials
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD=your_password \
  --from-literal=SHOPIFY_API_KEY=your_api_key \
  --from-literal=SHOPIFY_API_SECRET=your_api_secret \
  --from-literal=SHOPIFY_APP_URL=https://your-domain.com \
  --from-literal=SHOPIFY_WEBHOOK_SECRET=webhook_secret \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Environment Synchronization

```bash
# Load environment variables to K8s
source .env

# Update ConfigMap with environment variables
kubectl patch configmap app-config -n microservice-app --patch="
data:
  SHOPIFY_SCOPES: \"$SHOPIFY_SCOPES\"
  SHOPIFY_EMBEDDED: \"true\"
  NODE_ENV: \"development\"
"

# Update secrets
kubectl patch secret app-secrets -n microservice-app --patch="
data:
  SHOPIFY_API_KEY: $(echo -n $SHOPIFY_API_KEY | base64)
  SHOPIFY_API_SECRET: $(echo -n $SHOPIFY_API_SECRET | base64)
"
```

## 📊 Monitoring & Debugging

### Check Service Health

```bash
# Get all resources
kubectl get all -n microservice-app

# Check pod details
kubectl describe pod <pod-name> -n microservice-app

# Check service endpoints
kubectl get endpoints -n microservice-app

# Check resource usage
kubectl top pods -n microservice-app
```

### View Logs

```bash
# Stream logs from all services
kubectl logs -f deployment/auth-service -n microservice-app
kubectl logs -f deployment/app-service -n microservice-app
kubectl logs -f deployment/shopify-service -n microservice-app
kubectl logs -f deployment/webhook-service -n microservice-app
kubectl logs -f deployment/gateway-service -n microservice-app

# View database logs
kubectl logs -f statefulset/postgres -n microservice-app
```

### Database Access

```bash
# Port forward to PostgreSQL
kubectl port-forward svc/postgres-service 5432:5432 -n microservice-app

# Connect with psql (in another terminal)
psql -h localhost -p 5432 -U postgres -d microservice_app

# View tables
\dt

# Query data
SELECT * FROM shops;
```

### Service Testing

```bash
# Test API Gateway (main entry point)
curl http://localhost:3003/health

# Test Auth Service (session management)
curl http://localhost:3001/api/auth/health

# Test App Service (static files)
curl http://localhost:3000/health

# Test Shopify Service (optional)
curl http://localhost:3004/health

# Test Webhook Service (optional)
curl http://localhost:3005/health

# Test authentication flow (with real Shopify shop)
curl "http://localhost:3003/?shop=your-shop.myshopify.com&embedded=1"
```

## 🌐 Service URLs

### Development Mode

- **Frontend (Shopify CLI)**: http://localhost:3000 or https://your-app.ngrok.io
- **API Gateway**: http://localhost:3003 (JWT validation & routing)
- **Auth Service**: http://localhost:3001 (Session management & token exchange)
- **App Service**: http://localhost:3000 (Static file serving with API key injection)
- **Shopify Service**: http://localhost:3004 (Optional - API operations)
- **Webhook Service**: http://localhost:3005 (Optional - Webhook processing)
- **PostgreSQL**: localhost:5432 (Session storage)

### Production Mode

- **Application**: https://your-domain.com
- **Services**: Internal cluster communication only

## 🗄️ Database Management

### Initialize Multiple Databases

```bash
# The init script creates these databases:
# - microservice_app (main)
# - auth_service
# - app_service
# - webhook_service
# - shopify_service

# Access specific database
psql -h localhost -p 5432 -U postgres -d auth_service
```

### Database Migrations

```bash
# Run migrations for each service
cd web/auth && pnpm run migration:run
cd web/app && pnpm run migration:run
cd web/shopify && pnpm run migration:run
cd web/webhook && pnpm run migration:run
```

### Backup and Restore

```bash
# Backup
kubectl exec -it statefulset/postgres -n microservice-app -- pg_dump -U postgres microservice_app > backup.sql

# Restore
kubectl exec -i statefulset/postgres -n microservice-app -- psql -U postgres microservice_app < backup.sql
```

## 🔄 Scaling

### Manual Scaling

```bash
# Scale specific service
kubectl scale deployment shopify-service --replicas=3 -n microservice-app

# Scale all services
kubectl scale deployment --all --replicas=2 -n microservice-app
```

### Auto-scaling

```bash
# Enable HPA for a service
kubectl autoscale deployment shopify-service --cpu-percent=70 --min=2 --max=10 -n microservice-app

# Check HPA status
kubectl get hpa -n microservice-app
```

## 🧹 Cleanup

### Development Cleanup

```bash
# Stop port forwarding
pkill -f "kubectl port-forward"

# Delete development resources
kubectl delete -k k8s/overlays/development

# Delete namespace (removes everything)
kubectl delete namespace microservice-app

# Clean Docker images
docker system prune -f
```

### Production Cleanup

```bash
# Delete production resources
kubectl delete -k k8s/overlays/production

# Delete namespace (removes everything)
kubectl delete namespace microservice-app
```

### Complete Reset

```bash
# Stop all local processes
pkill -f "kubectl port-forward"
pkill -f "shopify app dev"
pkill -f "pnpm"

# Delete all K8s resources
kubectl delete namespace microservice-app

# Clean Docker
docker system prune -a -f

# Reinstall dependencies
rm -rf node_modules web/*/node_modules
pnpm install
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n microservice-app

# Describe problematic pod
kubectl describe pod <pod-name> -n microservice-app

# Check events
kubectl get events -n microservice-app --sort-by=.metadata.creationTimestamp
```

#### 2. Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -l app=postgres -n microservice-app

# Check service
kubectl get svc postgres-service -n microservice-app

# Test connection
kubectl exec -it deployment/auth-service -n microservice-app -- nc -zv postgres-service 5432
```

#### 3. Image Pull Errors

```bash
# Check image names in deployment
kubectl get deployment shopify-service -o yaml -n microservice-app

# Verify images exist
docker images | grep microservice-app

# Rebuild if necessary
docker build -t microservice-app/shopify-service:latest -f web/shopify/Dockerfile web/
```

#### 4. Service Discovery Issues

```bash
# Check service endpoints
kubectl get endpoints -n microservice-app

# Test service connectivity
kubectl exec -it deployment/gateway-service -n microservice-app -- curl http://auth-service:3002/health
```

#### 5. Shopify CLI Issues

```bash
# Check tunnel status
curl https://your-app.ngrok.io

# Verify environment variables
cat .env

# Check app configuration
cat shopify.app.toml
```

### Log Analysis

```bash
# Search for errors in logs
kubectl logs deployment/shopify-service -n microservice-app | grep -i error

# Get recent logs
kubectl logs --tail=100 deployment/auth-service -n microservice-app

# Follow logs with timestamp
kubectl logs -f --timestamps deployment/app-service -n microservice-app
```

## 📚 Additional Resources

### Directory Structure

```
microservice-app/
├── k8s/                          # Kubernetes configurations
│   ├── base/                     # Base resources
│   ├── overlays/                 # Environment-specific configs
│   └── manifests/                # Service manifests
├── web/                          # Application services
│   ├── auth/                     # Authentication service
│   ├── app/                      # Main application service
│   ├── shopify/                  # Shopify integration service
│   ├── webhook/                  # Webhook handling service
│   ├── api-gateway/              # API Gateway service
│   └── frontend/                 # React frontend
├── scripts/                      # Utility scripts
└── docs/                        # Documentation
```

### Service Responsibilities

- **API Gateway** (Port 3003):

  - Main entry point for all Shopify requests
  - JWT session token validation and signature verification
  - Automatic token exchange for new sessions
  - Smart routing to appropriate backend services
  - Embedded app authentication flow handling

- **Auth Service** (Port 3001):

  - Shopify OAuth 2.0 token exchange implementation
  - Persistent session storage and management
  - Database session CRUD operations
  - JWT token validation and decoding
  - Session lifecycle management

- **App Service** (Port 3000):

  - Static file serving with SHOPIFY_API_KEY injection
  - Server-side rendering for production
  - React app serving with environment variable replacement
  - Frontend asset delivery

- **PostgreSQL** (Port 5432):

  - Session storage with ShopifySession entity
  - User authentication data persistence
  - Transaction support for atomic session updates

- **Optional Services**:
  - **Shopify Service**: Shopify API integration, product management
  - **Webhook Service**: Shopify webhook processing
  - **Frontend**: React SPA for development (production uses SSR)

### Environment Variables Reference

| Variable                 | Description          | Example                      |
| ------------------------ | -------------------- | ---------------------------- |
| `SHOPIFY_API_KEY`        | Shopify app API key  | `abc123...`                  |
| `SHOPIFY_API_SECRET`     | Shopify app secret   | `def456...`                  |
| `SHOPIFY_SCOPES`         | Required permissions | `read_products,write_orders` |
| `DB_PASSWORD`            | PostgreSQL password  | `secretpassword`             |
| `SHOPIFY_WEBHOOK_SECRET` | Webhook verification | `webhook_secret`             |
| `NODE_ENV`               | Environment mode     | `development/production`     |

For more detailed information, refer to the `/docs` directory or visit [Shopify Developer Documentation](https://shopify.dev/).
