# Infrastructure Access Guide

Quick reference for accessing all infrastructure components in the local development environment.

## Installation Options

| Script | Charts | Purpose |
|--------|--------|---------|
| `./scripts/setup-helm-essentials.sh` | 8 | Core stack for development |
| `./scripts/setup-helm.sh` | 17 | Full stack with CKS security tools |

**Quick Start:** `./scripts/start.sh` | **Stop:** `./scripts/stop.sh`

---

## Essentials Stack (8 Charts)

### ArgoCD (GitOps)

**Installed via:** Helm chart `argo/argo-cd`

#### Access UI

```bash
# Start port-forward (if not running)
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Open browser
open https://localhost:8080
```

#### Credentials

| Field | Value |
|-------|-------|
| URL | https://localhost:8080 |
| Username | `admin` |
| Password | See `.env` file (`ARGOCD_PASSWORD`) |

#### Helm Commands

```bash
# Check Helm release
helm list -n argocd

# Upgrade ArgoCD
helm upgrade argocd argo/argo-cd -n argocd

# View Helm values
helm get values argocd -n argocd
```

#### Common Commands

```bash
# Check applications status
kubectl get applications -n argocd

# Force sync dev environment
kubectl patch application exam-study-app-dev -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Force sync prod environment
kubectl patch application exam-study-app-prod -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# View ArgoCD logs
kubectl logs -f deployment/argocd-server -n argocd

# View Image Updater logs
kubectl logs -f deployment/argocd-image-updater -n argocd
```

---

### Kubernetes Dashboard

**Installed via:** Helm chart `kubernetes-dashboard/kubernetes-dashboard`

#### Access UI

```bash
# Start port-forward (if not running)
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &

# Open browser
open https://localhost:8443
```

#### Credentials

| Field | Value |
|-------|-------|
| URL | https://localhost:8443 |
| Auth Method | Bearer Token |
| Token | See `.env` file (`K8S_DASHBOARD_TOKEN`) |

#### Helm Commands

```bash
# Check Helm release
helm list -n kubernetes-dashboard

# Upgrade Dashboard
helm upgrade kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard -n kubernetes-dashboard

# View Helm values
helm get values kubernetes-dashboard -n kubernetes-dashboard
```

#### Generate New Token

```bash
# Create a new long-lived token (10 years)
kubectl -n kubernetes-dashboard create token admin-user --duration=87600h
```

---

### Prometheus + Grafana (Monitoring)

**Installed via:** Helm chart `prometheus-community/kube-prometheus-stack`

#### Access Grafana UI

```bash
# Start port-forward (if not running)
kubectl port-forward svc/prometheus-grafana -n monitoring 3001:80 &

# Open browser
open http://localhost:3001
```

#### Credentials

| Field | Value |
|-------|-------|
| URL | http://localhost:3001 |
| Username | `admin` |
| Password | See `.env` file (`GRAFANA_PASSWORD`) |

**Get password from Kubernetes secret:**
```bash
kubectl get secret prometheus-grafana -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d && echo
```

#### Access Prometheus UI

```bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090 &
open http://localhost:9090
```

#### Helm Commands

```bash
# Check Helm release
helm list -n monitoring

# Upgrade Prometheus stack
helm upgrade prometheus prometheus-community/kube-prometheus-stack -n monitoring

# View Helm values
helm get values prometheus -n monitoring
```

#### Common Commands

```bash
# Check all monitoring pods
kubectl get pods -n monitoring

# View Prometheus logs
kubectl logs -f deployment/prometheus-kube-prometheus-operator -n monitoring

# View Grafana logs
kubectl logs -f deployment/prometheus-grafana -n monitoring
```

---

### Loki (Log Aggregation)

**Installed via:** Helm chart `grafana/loki-stack`

#### Access

Loki is accessed through Grafana as a data source. No separate UI.

```bash
# Check Loki pod
kubectl get pods -n monitoring -l app=loki

# View Loki logs
kubectl logs -f -n monitoring -l app=loki
```

#### Query Logs in Grafana

1. Open Grafana at http://localhost:3001
2. Go to **Explore** (compass icon)
3. Select **Loki** as the data source
4. Use LogQL queries:

```logql
# All logs from exam-study-app
{namespace="exam-study-dev", app="exam-study-app"}

# Error logs only
{namespace="exam-study-dev"} |= "error"

# Logs from last 5 minutes
{namespace="exam-study-dev"} | json | __error__=""
```

#### Helm Commands

```bash
# Check Helm release
helm list -n monitoring | grep loki

# Upgrade Loki
helm upgrade loki grafana/loki-stack -n monitoring

# View Helm values
helm get values loki -n monitoring
```

---

### Jaeger (Distributed Tracing)

**Installed via:** Helm chart `jaegertracing/jaeger`

#### Access UI

```bash
# Start port-forward (if not running)
kubectl port-forward svc/jaeger -n tracing 16686:16686 &

# Open browser
open http://localhost:16686
```

#### Credentials

| Field | Value |
|-------|-------|
| URL | http://localhost:16686 |
| Auth | Anonymous (no login required) |

#### Helm Commands

```bash
# Check Helm release
helm list -n tracing

# Upgrade Jaeger
helm upgrade jaeger jaegertracing/jaeger -n tracing

# View Helm values
helm get values jaeger -n tracing
```

#### Common Commands

```bash
# Check Jaeger pod
kubectl get pods -n tracing

# View Jaeger logs
kubectl logs -f -n tracing -l app.kubernetes.io/name=jaeger
```

---

### pgAdmin (PostgreSQL UI)

**Installed via:** Helm chart `runix/pgadmin4`

#### Access UI

```bash
# Start port-forward (if not running)
kubectl port-forward svc/pgadmin-pgadmin4 -n pgadmin 5050:80 &

# Open browser
open http://localhost:5050
```

#### Credentials

| Field | Value |
|-------|-------|
| URL | http://localhost:5050 |
| Email | `gabriel.ramos@rcconsultech.com` |
| Password | See `.env` file (`PGADMIN_PASSWORD`) |

**Get password from Kubernetes secret:**
```bash
kubectl get secret pgadmin-pgadmin4 -n pgadmin -o jsonpath='{.data.password}' | base64 -d && echo
```

#### Connect to PostgreSQL

After logging in, add a new server with:
- **Host**: `postgres.exam-study-dev.svc.cluster.local` (or `postgres.exam-study-prod.svc.cluster.local`)
- **Port**: `5432`
- **Database**: `study`
- **Username**: `study`
- **Password**: `study`

#### Helm Commands

```bash
# Check Helm release
helm list -n pgadmin

# Upgrade pgAdmin
helm upgrade pgadmin runix/pgadmin4 -n pgadmin

# View Helm values
helm get values pgadmin -n pgadmin
```

---

### cert-manager (TLS Certificates)

**Installed via:** Helm chart `jetstack/cert-manager`

#### About

cert-manager automates TLS certificate management. No UI - managed via kubectl.

#### Common Commands

```bash
# Check cert-manager pods
kubectl get pods -n cert-manager

# List certificates
kubectl get certificates -A

# List certificate requests
kubectl get certificaterequests -A

# List issuers
kubectl get issuers -A
kubectl get clusterissuers

# Describe a certificate
kubectl describe certificate <name> -n <namespace>
```

#### Create a Self-Signed Issuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
```

#### Helm Commands

```bash
# Check Helm release
helm list -n cert-manager

# Upgrade cert-manager
helm upgrade cert-manager jetstack/cert-manager -n cert-manager --set crds.enabled=true

# View Helm values
helm get values cert-manager -n cert-manager
```

---

## Full Stack Additional Charts (Optional)

These are installed with `./scripts/setup-helm.sh` but not with essentials:

| Chart | Namespace | Purpose |
|-------|-----------|---------|
| Istio + Kiali | istio-system | Service mesh |
| Envoy Gateway | envoy-gateway-system | Gateway API |
| Metrics Server | kube-system | kubectl top support |
| Falco | falco | Runtime security |
| OPA Gatekeeper | gatekeeper-system | Policy enforcement |
| Sealed Secrets | kube-system | Encrypted secrets |
| Trivy Operator | trivy-system | Vulnerability scanning |

To install these:
```bash
./scripts/setup-helm.sh
```

---

## Kubernetes (Docker Desktop)

### Cluster Access

```bash
# Verify cluster is running
kubectl cluster-info

# Check all namespaces
kubectl get namespaces

# View all resources in exam-study namespace
kubectl get all -n exam-study
kubectl get all -n exam-study-dev
kubectl get all -n exam-study-prod
```

### Application Access

| Environment | URL | Namespace |
|-------------|-----|-----------|
| Dev | http://localhost:30001 | exam-study-dev |
| Prod | http://localhost:30000 | exam-study-prod |
| Direct (no ArgoCD) | http://localhost:30000 | exam-study |

### Common Commands

```bash
# View pods
kubectl get pods -n exam-study-dev
kubectl get pods -n exam-study-prod

# View logs
kubectl logs -f deployment/exam-study-app -n exam-study-dev
kubectl logs -f deployment/postgres -n exam-study-dev

# Execute shell in pod
kubectl exec -it deployment/exam-study-app -n exam-study-dev -- sh

# Restart deployment
kubectl rollout restart deployment/exam-study-app -n exam-study-dev

# Scale deployment
kubectl scale deployment/exam-study-app --replicas=2 -n exam-study-dev
```

---

## PostgreSQL Database

### Access via kubectl

```bash
# Port-forward to access locally
kubectl port-forward svc/postgres 5432:5432 -n exam-study-dev &

# Connect with psql
psql postgresql://study:study@localhost:5432/study

# Or exec directly into pod
kubectl exec -it deployment/postgres -n exam-study-dev -- psql -U study -d study
```

### Credentials

| Field | Value |
|-------|-------|
| Host | `localhost` (with port-forward) or `postgres` (in-cluster) |
| Port | `5432` |
| Database | `study` |
| Username | `study` |
| Password | `study` |
| Connection String | `postgresql://study:study@localhost:5432/study` |

### Common Queries

```sql
-- List tables
\dt

-- Describe table
\d "Question"

-- Count questions
SELECT COUNT(*) FROM "Question";

-- View exams
SELECT * FROM "Exam";
```

### Prisma Studio

```bash
# Port-forward PostgreSQL first
kubectl port-forward svc/postgres 5432:5432 -n exam-study-dev &

# Run Prisma Studio
DATABASE_URL="postgresql://study:study@localhost:5432/study" npx prisma studio
# Opens at http://localhost:5555
```

---

## GitHub Container Registry (GHCR)

### Image URLs

| Image | Tag | URL |
|-------|-----|-----|
| Dev | `:dev` | `ghcr.io/gabrielramos-rc/exam-study-app:dev` |
| Prod | `:latest` | `ghcr.io/gabrielramos-rc/exam-study-app:latest` |
| Version | `:v1.0.0` | `ghcr.io/gabrielramos-rc/exam-study-app:v1.0.0` |

### Pull Images

```bash
# Login to GHCR (use GitHub PAT)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/gabrielramos-rc/exam-study-app:dev
docker pull ghcr.io/gabrielramos-rc/exam-study-app:latest
```

---

## GitHub Actions

### Workflows Dashboard

https://github.com/gabrielramos-rc/exam-study-app/actions

### Key Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | Push/PR to main, dev | Build, lint, test |
| Docker Dev | Push to dev | Build `:dev` image |
| Docker Publish | Release | Build `:latest` image |
| CodeQL | Push/PR, weekly | Security analysis |

---

## Service Ports Summary

### Essentials Stack

| Service | Port | Protocol | Access Method |
|---------|------|----------|---------------|
| App (Dev) | 30001 | HTTP | NodePort |
| App (Prod) | 30000 | HTTP | NodePort |
| ArgoCD UI | 8080 | HTTPS | Port-forward |
| K8s Dashboard | 8443 | HTTPS | Port-forward |
| Grafana | 3001 | HTTP | Port-forward |
| Prometheus | 9090 | HTTP | Port-forward |
| Jaeger | 16686 | HTTP | Port-forward |
| pgAdmin | 5050 | HTTP | Port-forward |
| PostgreSQL | 5432 | TCP | Port-forward |
| Prisma Studio | 5555 | HTTP | Local |

### Full Stack (Additional)

| Service | Port | Protocol | Access Method |
|---------|------|----------|---------------|
| Kiali | 20001 | HTTP | Port-forward |

---

## Troubleshooting

### ArgoCD UI Not Accessible

```bash
# Check if port-forward is running
ps aux | grep "port-forward.*argocd" | grep -v grep

# Restart port-forward
pkill -f "port-forward.*argocd"
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
```

### Application Not Syncing

```bash
# Check application status
kubectl describe application exam-study-app-dev -n argocd

# Check events
kubectl get events -n exam-study-dev --sort-by=.lastTimestamp

# Force refresh
kubectl patch application exam-study-app-dev -n argocd \
  --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n exam-study-dev -l app=postgres
kubectl describe pod -n exam-study-dev -l app=postgres

# Check service
kubectl get svc postgres -n exam-study-dev

# Test connectivity from app pod
kubectl exec -it deployment/exam-study-app -n exam-study-dev -- nc -zv postgres 5432
```

### Reset Everything

```bash
# Delete all environments
kubectl delete namespace exam-study-dev exam-study-prod exam-study

# Restart ArgoCD applications
kubectl delete applications --all -n argocd
kubectl apply -f k8s/argocd/

# Full Helm reinstall (essentials)
./scripts/teardown-helm-essentials.sh
./scripts/setup-helm-essentials.sh

# Or full stack
./scripts/teardown-helm.sh
./scripts/setup-helm.sh
```

---

## Quick Start Checklist

1. **Start all services with one command**
   ```bash
   ./scripts/start.sh
   ```

   Or manually:

2. **Verify Kubernetes is running**
   ```bash
   kubectl cluster-info
   ```

3. **Start port-forwards**
   ```bash
   # ArgoCD
   kubectl port-forward svc/argocd-server -n argocd 8080:443 &

   # Kubernetes Dashboard
   kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &

   # Grafana
   kubectl port-forward svc/prometheus-grafana -n monitoring 3001:80 &

   # pgAdmin
   kubectl port-forward svc/pgadmin-pgadmin4 -n pgadmin 5050:80 &

   # Jaeger
   kubectl port-forward svc/jaeger -n tracing 16686:16686 &
   ```

4. **Access the UIs**

   | Service | URL | Credentials |
   |---------|-----|-------------|
   | ArgoCD | https://localhost:8080 | admin / `.env` |
   | K8s Dashboard | https://localhost:8443 | Token from `.env` |
   | Grafana | http://localhost:3001 | admin / `.env` |
   | pgAdmin | http://localhost:5050 | `.env` |
   | Jaeger | http://localhost:16686 | Anonymous |

5. **Access the application**
   - Dev: http://localhost:30001
   - Prod: http://localhost:30000

6. **Stop the environment**
   ```bash
   ./scripts/stop.sh
   ```
