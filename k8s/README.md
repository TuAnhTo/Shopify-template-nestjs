# 🚀 Kubernetes Manual Setup Guide

Complete manual setup guide for the Shopify microservice application with authentication flow and hot reload.

## 📋 Prerequisites

- **Kubernetes cluster** (minikube, Docker Desktop, or cloud provider)
- **kubectl** configured to access your cluster
- **Docker** for building images
- **pnpm** installed globally
- **Shopify CLI** for frontend development

## 🛠️ **Manual Setup Steps**

### Step 1: **Update Development Paths**

Replace placeholder paths with your actual project path:

```bash
# Navigate to project root
cd /path/to/your/microservice-app

# Update PROJECT_ROOT_PLACEHOLDER with your actual path
sed -i.bak "s|PROJECT_ROOT_PLACEHOLDER|$(pwd)|g" k8s/overlays/development/development-config.yaml

# Verify paths were updated correctly
grep -n "$(pwd)" k8s/overlays/development/development-config.yaml
```

### Step 2: **Build All Docker Images**

Build each microservice image individually:

```bash
# Navigate to project root
cd /path/to/your/microservice-app

# Build all microservice images
docker build -t microservice-app/auth-service:dev-latest -f web/auth/Dockerfile web/
docker build -t microservice-app/app-service:dev-latest -f web/app/Dockerfile web/
docker build -t microservice-app/shopify-service:dev-latest -f web/shopify/Dockerfile web/
docker build -t microservice-app/webhook-service:dev-latest -f web/webhook/Dockerfile web/
docker build -t microservice-app/gateway-service:dev-latest -f web/api-gateway/Dockerfile web/

# Verify images were built
docker images | grep microservice-app
```

### Step 3: **Create Kubernetes Namespace**

```bash
# Create namespace
kubectl create namespace microservice-app

# Verify namespace was created
kubectl get namespaces | grep microservice-app
```

### Step 4: **Deploy to Kubernetes**

Apply the development configuration:

```bash
# Apply development configuration
kubectl apply -k k8s/overlays/development

# Wait for all services to be ready (this may take 2-5 minutes)
kubectl wait --for=condition=available --timeout=300s deployment -l app.kubernetes.io/name=microservice-app -n microservice-app
```

### Step 5: **Setup Port Forwarding**

Open separate terminal windows for each service:

```bash
# Terminal 1: API Gateway
kubectl port-forward svc/gateway-service 3001:3001 -n microservice-app

# Terminal 2: Auth Service  
kubectl port-forward svc/auth-service 3002:3002 -n microservice-app

# Terminal 3: App Service
kubectl port-forward svc/app-service 3003:3003 -n microservice-app

# Terminal 4: Shopify Service
kubectl port-forward svc/shopify-service 3004:3004 -n microservice-app

# Terminal 5: Webhook Service
kubectl port-forward svc/webhook-service 3005:3005 -n microservice-app

# Terminal 6: Database (if needed)
kubectl port-forward svc/postgres-service 5432:5432 -n microservice-app
```

### Step 6: **Start Frontend Development**

In a new terminal, start the Shopify CLI:

```bash
# Navigate to frontend directory
cd web/frontend

# Start Shopify CLI (handles tunnel automatically)
shopify app dev
```

## ✅ **Verification Tests**

### 1. **Health Check All Services**

Test each service health endpoint:

```bash
# API Gateway
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"api-gateway","timestamp":"..."}

# Auth Service
curl http://localhost:3002/api/config/health
# Expected: {"status":"ok","service":"auth","timestamp":"..."}

# App Service
curl http://localhost:3003/api/app/health
# Expected: {"status":"ok","service":"app-service","timestamp":"..."}

# Shopify Service
curl http://localhost:3004/api/shopify/health
# Expected: {"status":"ok","service":"shopify","timestamp":"..."}

# Webhook Service
curl http://localhost:3005/api/webhooks/health
# Expected: {"status":"ok","service":"webhook","timestamp":"..."}
```

### 2. **Configuration Endpoints**

```bash
# Get public configuration
curl http://localhost:3001/api/config
# Expected: {"shopifyApiKey":"...","shopifyScopes":"...","appUrl":"..."}

# Get auth URL template
curl http://localhost:3001/api/config/auth-url
# Expected: {"authUrlTemplate":"...","redirectUri":"...","scopes":"..."}
```

### 3. **Test Hot Reload (Development)**

```bash
# Make a change to any backend service file
echo "// Test change $(date)" >> web/auth/src/controllers/config.controller.ts

# Watch the logs - should see reload messages
kubectl logs -f deployment/auth-service -n microservice-app
# Expected: "File change detected. Starting incremental compilation..."
```

## 🏗️ **Architecture Overview**

### Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Gateway       │    │   Shopify CLI   │
│   (React)       │────│   Service       │────│   (Tunnel)      │
│   Shopify CLI   │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │ App Service │ │   Shopify  │
        │ Port: 3002   │ │ Port: 3003  │ │  Service   │
        │ OAuth Flow   │ │ Main Logic  │ │ Port: 3004 │
        └──────┬───────┘ └─────────────┘ └────────────┘
               │                               │
        ┌──────▼──────┐                ┌─────▼──────┐
        │  Webhook    │                │ PostgreSQL │
        │  Service    │                │ Port: 5432 │
        │ Port: 3005  │                │            │
        └─────────────┘                └────────────┘
```

### Authentication Flow
1. **OAuth Initiation**: `GET /auth/shopify?shop={shop}` 
2. **OAuth Callback**: `GET /auth/shopify/callback`
3. **Session Token Exchange**: `POST /api/auth/shopify/token-exchange`
4. **Protected API Access**: All `/api/shopify/*` routes with session validation

## 📁 Directory Structure

```
k8s/
├── base/
│   ├── namespace.yaml           # Namespace definition
│   ├── configmap.yaml          # Environment variables
│   └── kustomization.yaml      # Base kustomization
├── overlays/
│   ├── development/            # Development with hot reload
│   │   ├── development-config.yaml
│   │   └── kustomization.yaml
│   └── production/             # Production environment
└── manifests/
    ├── database/               # PostgreSQL setup
    └── services/               # All microservices
        ├── auth-service.yaml
        ├── app-service.yaml
        ├── shopify-service.yaml
        ├── webhook-service.yaml
        └── gateway-service.yaml
```

## 🔧 **Configuration Management**

### Environment Variables (ConfigMap)
- `NODE_ENV=development`
- `CHOKIDAR_USEPOLLING=true` (hot reload)
- `NEST_WATCH=true` (NestJS watch mode)
- Service URLs and ports

### Secrets Management
Update Shopify credentials before deployment:

```bash
# Create or update secrets
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD=password \
  --from-literal=SHOPIFY_API_KEY=your_api_key \
  --from-literal=SHOPIFY_API_SECRET=your_api_secret \
  --from-literal=SHOPIFY_WEBHOOK_SECRET=your_webhook_secret \
  --namespace=microservice-app \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 🔍 **Monitoring & Debugging**

### Check Pod Status
```bash
# View all pods
kubectl get pods -n microservice-app

# Check specific pod details
kubectl describe pod <pod-name> -n microservice-app

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

# Database logs
kubectl logs -f statefulset/postgres -n microservice-app
```

### Database Connection
```bash
# Connect to PostgreSQL
kubectl port-forward svc/postgres-service 5432:5432 -n microservice-app

# In another terminal
psql -h localhost -p 5432 -U postgres -d microservice_app
# Password: password
```

## 🚨 **Troubleshooting**

### 1. **Services Not Starting**
```bash
# Check pod events
kubectl get events -n microservice-app --sort-by=.metadata.creationTimestamp

# Check specific pod logs
kubectl logs <pod-name> -n microservice-app

# Check image pull status
kubectl describe deployment <service-name> -n microservice-app
```

### 2. **Hot Reload Not Working**
```bash
# Check volume mounts
kubectl describe pod <pod-name> -n microservice-app | grep -A 10 "Mounts"

# Verify environment variables
kubectl exec -it deployment/auth-service -n microservice-app -- env | grep -E "(CHOKIDAR|NEST|NODE)"
```

### 3. **Authentication Issues**
```bash
# Check API Gateway has Shopify credentials
kubectl exec -it deployment/gateway-service -n microservice-app -- env | grep SHOPIFY

# Test session token (get token from browser console after shopify app dev)
curl -H "Authorization: Bearer <session-token>" http://localhost:3001/api/shopify/session
```

### 4. **Port Forward Issues**
```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Check what's running on ports
lsof -i :3001,3002,3003,3004,3005,5432 | grep kubectl

# Restart port forwarding
kubectl port-forward svc/gateway-service 3001:3001 -n microservice-app &
# Repeat for other services...
```

## 🔄 **Development Workflow**

### Daily Development Routine
```bash
# 1. Ensure Kubernetes is running
kubectl cluster-info

# 2. Check if services are running
kubectl get pods -n microservice-app

# 3. If not running, apply configuration
kubectl apply -k k8s/overlays/development

# 4. Setup port forwarding (if needed)
# Run the port forward commands from Step 5

# 5. Start frontend
cd web/frontend && shopify app dev

# 6. Start coding! Hot reload is active for all services
```

### Making Code Changes
- **Backend**: Changes automatically reload due to volume mounts and file watching
- **Frontend**: Shopify CLI handles hot reload automatically
- **Database**: Use port forwarding to access PostgreSQL directly

### Testing Authentication
```bash
# 1. Open Shopify app in browser (from shopify app dev output)
# 2. Open browser console
# 3. Get session token: 
#    const token = await app.sessionToken.get();
# 4. Test backend APIs with token:
#    fetch('/api/shopify/products', { headers: { Authorization: `Bearer ${token}` } })
```

## 🧹 **Cleanup**

### Remove Everything
```bash
# Delete the entire namespace (removes all resources)
kubectl delete namespace microservice-app

# Remove local Docker images (optional)
docker rmi $(docker images microservice-app/* -q)
```

### Restart Fresh
```bash
# 1. Cleanup
kubectl delete namespace microservice-app

# 2. Rebuild images
# Run Step 2 commands again

# 3. Redeploy
# Run Steps 3-6 again
```

## ✅ **Success Criteria**

Your setup is successful when:

- ✅ All 5 backend services are running and healthy
- ✅ Port forwarding is active for all services  
- ✅ Shopify CLI starts frontend with tunnel
- ✅ Hot reload works for backend code changes
- ✅ Authentication flow validates session tokens
- ✅ API endpoints respond correctly
- ✅ Database connections work
- ✅ Frontend can communicate with backend APIs

## 🎯 **Next Steps**

After successful setup:
1. **Configure Shopify App**: Update app settings with tunnel URL
2. **Test OAuth Flow**: Complete authentication flow in browser
3. **Develop Features**: Add your business logic to respective services
4. **Monitor Performance**: Use `kubectl top` and logs for debugging

---

**🎉 Your microservice application with complete Shopify authentication is ready for development!**

This manual setup ensures you have full control over each step and can troubleshoot issues as they arise.