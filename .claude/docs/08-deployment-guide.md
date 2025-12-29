# Deployment Guide

**Related Docs:**
- `10-infrastructure-access.md` - Credentials, URLs, and access commands for all infrastructure

## Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl CLI installed
- Helm CLI installed (`brew install helm`)
- 4GB RAM minimum (Kubernetes overhead)
- 10GB disk space

---

## Quick Start

```bash
# Clone/copy the project
cd exam-study-app

# Enable Kubernetes in Docker Desktop
# Docker Desktop → Settings → Kubernetes → Enable Kubernetes

# Deploy to Kubernetes
kubectl apply -f k8s/base/

# Wait for pods to be ready
kubectl get pods -n exam-study -w

# Access the app
open http://localhost:30000
```

---

## Kubernetes Configuration

### Directory Structure

```
k8s/
├── base/                       # Core manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── postgres/
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── app/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   └── jobs/
│       └── migration-job.yaml
│
├── security/                   # CKS-focused hardening
│   ├── network-policies/
│   ├── rbac/
│   └── pod-security.yaml
│
└── overlays/                   # Kustomize environments
    ├── dev/
    └── prod/
```

### namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: exam-study
  labels:
    app.kubernetes.io/name: exam-study-app
```

### configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: exam-study-config
  namespace: exam-study
data:
  NODE_ENV: "production"
  PORT: "3000"
  UPLOAD_MAX_SIZE: "52428800"
```

### secret.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: exam-study-secrets
  namespace: exam-study
type: Opaque
stringData:
  DATABASE_URL: "postgresql://study:study@postgres:5432/study"
  POSTGRES_USER: "study"
  POSTGRES_PASSWORD: "study"
  POSTGRES_DB: "study"
```

### postgres/pvc.yaml

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: exam-study
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### postgres/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: exam-study
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:18-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: exam-study-secrets
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: exam-study-secrets
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: exam-study-secrets
                  key: POSTGRES_DB
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "study"]
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "study"]
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
```

### postgres/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: exam-study
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
```

### app/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: exam-study-app
  namespace: exam-study
spec:
  replicas: 1
  selector:
    matchLabels:
      app: exam-study-app
  template:
    metadata:
      labels:
        app: exam-study-app
    spec:
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z postgres 5432; do echo waiting for postgres; sleep 2; done']
      containers:
        - name: app
          image: exam-study-app:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: exam-study-config
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: exam-study-secrets
                  key: DATABASE_URL
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: uploads
              mountPath: /app/uploads
            - name: images
              mountPath: /app/public/images
      volumes:
        - name: uploads
          emptyDir: {}
        - name: images
          emptyDir: {}
```

### app/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: exam-study-app
  namespace: exam-study
spec:
  selector:
    app: exam-study-app
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30000
  type: NodePort
```

### jobs/migration-job.yaml

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: exam-study
spec:
  template:
    spec:
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z postgres 5432; do echo waiting for postgres; sleep 2; done']
      containers:
        - name: migrate
          image: exam-study-app:latest
          command: ["npx", "prisma", "migrate", "deploy"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: exam-study-secrets
                  key: DATABASE_URL
      restartPolicy: OnFailure
  backoffLimit: 3
```

### Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directories for volumes
RUN mkdir -p /app/uploads /app/public/images

# Run as non-root user (CKS best practice)
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@postgres:5432/db` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | App port | `3000` |
| `UPLOAD_MAX_SIZE` | Max ZIP upload size (bytes) | `52428800` (50MB) |

---

## Development Setup

### Local Development (Kubernetes)

```bash
# Build Docker image
docker build -t exam-study-app:latest .

# Apply Kubernetes manifests
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/

# Run migrations
kubectl apply -f k8s/base/jobs/migration-job.yaml
kubectl wait --for=condition=complete job/db-migration -n exam-study

# Access app
open http://localhost:30000

# Watch logs
kubectl logs -f deployment/exam-study-app -n exam-study
```

### Local Development (without Kubernetes)

```bash
# Install dependencies
npm install

# Start PostgreSQL only (using kubectl)
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/secret.yaml
kubectl apply -f k8s/base/postgres/

# Port-forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n exam-study &

# Create .env file
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

---

## Common kubectl Commands

### View Resources

```bash
# All resources in namespace
kubectl get all -n exam-study

# Pods with status
kubectl get pods -n exam-study

# Services
kubectl get svc -n exam-study

# Watch pods
kubectl get pods -n exam-study -w
```

### Logs & Debugging

```bash
# App logs
kubectl logs -f deployment/exam-study-app -n exam-study

# PostgreSQL logs
kubectl logs -f deployment/postgres -n exam-study

# Exec into app pod
kubectl exec -it deployment/exam-study-app -n exam-study -- sh

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n exam-study

# Events
kubectl get events -n exam-study --sort-by=.lastTimestamp
```

### Manage Deployments

```bash
# Restart app
kubectl rollout restart deployment/exam-study-app -n exam-study

# Scale app
kubectl scale deployment/exam-study-app --replicas=2 -n exam-study

# Rollback
kubectl rollout undo deployment/exam-study-app -n exam-study

# Update image
kubectl set image deployment/exam-study-app app=exam-study-app:v2 -n exam-study
```

---

## Database Management

### Run Migrations

```bash
# Via Job
kubectl apply -f k8s/base/jobs/migration-job.yaml

# Check job status
kubectl get jobs -n exam-study

# View migration logs
kubectl logs job/db-migration -n exam-study

# Delete completed job (to re-run)
kubectl delete job db-migration -n exam-study
```

### Database Shell

```bash
# Exec into PostgreSQL
kubectl exec -it deployment/postgres -n exam-study -- psql -U study -d study

# Common queries
\dt                    # List tables
\d "Question"          # Describe table
SELECT COUNT(*) FROM "Question";
```

### Prisma Studio

```bash
# Port-forward PostgreSQL first
kubectl port-forward svc/postgres 5432:5432 -n exam-study &

# Then run Prisma Studio locally
DATABASE_URL="postgresql://study:study@localhost:5432/study" npx prisma studio
```

---

## Backup & Restore

### Backup Database

```bash
# Create backup
kubectl exec deployment/postgres -n exam-study -- \
  pg_dump -U study study > backup-$(date +%Y%m%d).sql

# Or exec into pod
kubectl exec -it deployment/postgres -n exam-study -- \
  pg_dump -U study study -f /tmp/backup.sql
kubectl cp exam-study/postgres-xxx:/tmp/backup.sql ./backup.sql
```

### Restore Database

```bash
# Copy backup to pod
kubectl cp backup.sql exam-study/postgres-xxx:/tmp/backup.sql

# Restore
kubectl exec -it deployment/postgres -n exam-study -- \
  psql -U study study -f /tmp/backup.sql
```

---

## Troubleshooting

### Pod Won't Start

```bash
# Check pod status
kubectl get pods -n exam-study

# Describe pod for events
kubectl describe pod <pod-name> -n exam-study

# Common issues:
# - ImagePullBackOff: Image not found, build it first
# - CrashLoopBackOff: Check logs
# - Pending: Not enough resources
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
kubectl get pods -n exam-study -l app=postgres

# Check service exists
kubectl get svc postgres -n exam-study

# Test connection from app pod
kubectl exec -it deployment/exam-study-app -n exam-study -- \
  nc -zv postgres 5432
```

### Reset Everything

```bash
# Delete namespace (removes everything)
kubectl delete namespace exam-study

# Rebuild and redeploy
docker build -t exam-study-app:latest .
kubectl apply -f k8s/base/
```

---

## Production Considerations

### Ingress with TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: exam-study-ingress
  namespace: exam-study
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - study.example.com
      secretName: exam-study-tls
  rules:
    - host: study.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: exam-study-app
                port:
                  number: 80
```

### Security Best Practices (CKS)

1. **Change default passwords** in Secrets
2. **Enable Network Policies** to restrict traffic
3. **Use Pod Security Standards** (restricted)
4. **Run as non-root** (already configured in Dockerfile)
5. **Set resource limits** on all containers
6. **Use RBAC** with minimal permissions
7. **Regular backups** of PostgreSQL data

### Resource Recommendations

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| App | 250m | 500m | 256Mi | 512Mi |
| PostgreSQL | 250m | 500m | 256Mi | 512Mi |

---

## Monitoring

### Health Checks

```bash
# App health
kubectl exec deployment/exam-study-app -n exam-study -- \
  wget -qO- http://localhost:3000/api/health

# PostgreSQL health
kubectl exec deployment/postgres -n exam-study -- pg_isready -U study
```

### Resource Usage

```bash
# Pod resource usage (requires metrics-server)
kubectl top pods -n exam-study

# Node resources
kubectl top nodes
```

---

## GitOps with ArgoCD

ArgoCD provides automated deployments with separate Dev and Prod environments.

**Installed via:** Helm (see `./scripts/setup-helm.sh`)

### Environments

| Environment | Branch | Port | Sync Mode | Image Tag |
|-------------|--------|------|-----------|-----------|
| **Dev** | `dev` | 30001 | Auto | `:dev` |
| **Prod** | `main` | 30000 | Manual | `:latest` |

### Quick Setup with Helm

```bash
# Run the Helm setup script (installs ArgoCD + Dashboard)
./scripts/setup-helm.sh

# Or install manually:
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd -n argocd --create-namespace
helm install argocd-image-updater argo/argocd-image-updater -n argocd
kubectl apply -f k8s/argocd/
```

### Access ArgoCD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
open https://localhost:8080
# Login: admin / <password from .env>
```

### Helm Releases

```bash
# List releases
helm list -A

# Upgrade ArgoCD
helm upgrade argocd argo/argo-cd -n argocd

# Upgrade Image Updater
helm upgrade argocd-image-updater argo/argocd-image-updater -n argocd
```

### Git Branching Strategy

```
feature/* ──► dev ──────────► main ──────────► Release
               │                │
               ▼                ▼
           :dev image       :latest image
               │                │
               ▼                ▼
           DEV ENV          PROD ENV
           (auto)           (manual)
           :30001           :30000
```

### Development Workflow

```bash
# 1. Work on dev branch
git checkout dev
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add feature"

# 2. Merge to dev → Auto-deploys to localhost:30001
git checkout dev
git merge feature/my-feature
git push origin dev

# 3. When ready for prod
git checkout main
git merge dev
git push origin main
gh release create v1.0.0

# 4. Manually sync prod
kubectl patch application exam-study-app-prod -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
```

### Common Commands

```bash
# Check sync status
kubectl get applications -n argocd

# Force sync dev
kubectl patch application exam-study-app-dev -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Force sync prod
kubectl patch application exam-study-app-prod -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# View in UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Teardown

```bash
# Teardown all Helm releases (ArgoCD + Dashboard)
./scripts/teardown-helm.sh
```

See `k8s/argocd/README.md` for detailed ArgoCD documentation
