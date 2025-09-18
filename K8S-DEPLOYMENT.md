# 🚀 Kubernetes Production Deployment Guide

## Quick Start

### 1. Build Docker Images
```bash
# Build all service images for production
./scripts/build-images.sh dev-latest

# Or build individually
docker build -t microservice-app/auth-service:dev-latest -f web/auth/Dockerfile web/
docker build -t microservice-app/gateway-service:dev-latest -f web/api-gateway/Dockerfile web/
docker build -t microservice-app/app-service:dev-latest -f web/app/Dockerfile web/
docker build -t microservice-app/webhook-service:dev-latest -f web/webhook/Dockerfile web/
```

### 2. Deploy to Kubernetes
```bash
# Deploy production environment
./scripts/deploy-k8s.sh production

# Or deploy manually
kubectl apply -k k8s/overlays/production
```

### 3. Access Services
```bash
# Port forward to access services
kubectl port-forward svc/gateway-service 3003:3003 -n microservice-app &
kubectl port-forward svc/auth-service 3001:3001 -n microservice-app &
kubectl port-forward svc/app-service 3000:3000 -n microservice-app &
kubectl port-forward svc/postgres-service 5432:5432 -n microservice-app &

# Test access
curl http://localhost:3003/health  # Gateway
curl http://localhost:3001/api/auth/health  # Auth Service
curl http://localhost:3000/health  # App Service
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│    Ingress      │────│   Gateway       │
│   (Port 80)     │    │   (Port 3003)   │
└─────────────────┘    └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│Auth Service │         │App Service  │         │Webhook Srv  │
│Port: 3001   │         │Port: 3000   │         │Port: 3005   │ 
│JWT + OAuth  │         │Static Files │         │Shopify Hook │
└─────────────┘         └─────────────┘         └─────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                        ┌─────────────┐
                        │PostgreSQL   │
                        │Port: 5432   │
                        │Sessions DB  │
                        └─────────────┘
```

## 📦 Services Included

### Core Services (Essential)
1. **API Gateway** (Port 3003) - Main entry point, JWT validation, routing
2. **Auth Service** (Port 3001) - Session management, token exchange
3. **App Service** (Port 3000) - Static file serving with API key injection
4. **PostgreSQL** (Port 5432) - Session storage database

### Optional Services  
5. **Webhook Service** (Port 3005) - Shopify webhook processing

## 🔧 Configuration

### Environment Variables (ConfigMap)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_HOST`, `GATEWAY_HOST`, `APP_HOST` - Internal service URLs
- `NODE_ENV` - Environment (production)
- `SHOPIFY_SCOPES` - Required Shopify permissions

### Secrets
- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app secret
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing secret

## 🛠️ Management Commands

### Check Status
```bash
kubectl get pods -n microservice-app
kubectl get services -n microservice-app
kubectl get ingress -n microservice-app
```

### View Logs
```bash
kubectl logs -f deployment/gateway-service -n microservice-app
kubectl logs -f deployment/auth-service -n microservice-app
kubectl logs -f deployment/app-service -n microservice-app
kubectl logs -f statefulset/postgres -n microservice-app
```

### Scale Services
```bash
kubectl scale deployment gateway-service --replicas=3 -n microservice-app
kubectl scale deployment auth-service --replicas=3 -n microservice-app
```

### Update Configuration
```bash
# Edit ConfigMap
kubectl edit configmap app-config -n microservice-app

# Edit Secrets
kubectl edit secret app-secrets -n microservice-app

# Restart deployments to pick up changes
kubectl rollout restart deployment/gateway-service -n microservice-app
kubectl rollout restart deployment/auth-service -n microservice-app
```

### Cleanup
```bash
# Delete everything
kubectl delete namespace microservice-app

# Or delete specific deployment
kubectl delete -k k8s/overlays/production
```

## 🔒 Production Considerations

### Before Production Deployment:
1. **Update secrets** in `k8s/overlays/production/production-secrets.yaml`:
   - Strong database password
   - Real Shopify app credentials
   - Strong JWT secret

2. **Configure ingress** with your domain in `k8s/base/ingress.yaml`

3. **Set resource limits** based on your cluster capacity

4. **Enable SSL/TLS** with cert-manager or cloud provider

5. **Configure monitoring** and logging

### Production Deployment:
```bash
# Build production images
./scripts/build-images.sh dev-latest

# Deploy to production
./scripts/deploy-k8s.sh production
```

## 🐛 Troubleshooting

### Common Issues:

#### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n microservice-app
kubectl logs <pod-name> -n microservice-app
```

#### Database Connection Issues
```bash
kubectl exec -it statefulset/postgres -n microservice-app -- psql -U postgres -d microservice_app
```

#### Service Discovery Issues
```bash
kubectl exec -it deployment/gateway-service -n microservice-app -- nslookup auth-service
```

#### Image Pull Errors
```bash
# Check if images exist
docker images | grep microservice-app

# Rebuild if needed
./scripts/build-images.sh dev-latest
```

For more details, see the main [README.md](./README.md).