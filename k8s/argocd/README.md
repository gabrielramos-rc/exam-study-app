# ArgoCD Multi-Environment GitOps Setup

This directory contains ArgoCD configuration for GitOps-based deployments with separate Dev and Prod environments.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   Source    │     │  k8s/overlays/  │     │  k8s/overlays/  │   │
│  │   Code      │     │      dev/       │     │      prod/      │   │
│  └─────────────┘     └─────────────────┘     └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐    ┌───────────────┐       ┌───────────────┐
│  GitHub Actions │    │    ArgoCD     │       │    ArgoCD     │
│  Build :dev tag │───▶│   Dev App     │       │   Prod App    │
└─────────────────┘    │  (auto-sync)  │       │ (manual sync) │
                       └───────────────┘       └───────────────┘
                              │                       │
                              ▼                       ▼
                       ┌─────────────┐         ┌─────────────┐
                       │ exam-study- │         │ exam-study- │
                       │    dev      │         │    prod     │
                       │  :30001     │         │   :30000    │
                       └─────────────┘         └─────────────┘
```

## Environments

| Environment | Namespace | Port | Sync Mode | Image Tag |
|-------------|-----------|------|-----------|-----------|
| **Dev** | exam-study-dev | 30001 | Auto | `:dev` |
| **Prod** | exam-study-prod | 30000 | Manual | `:latest` |

## Quick Start

```bash
# Run the setup script
./scripts/setup-argocd.sh

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
open https://localhost:8080
```

## Files

| File | Description |
|------|-------------|
| `project.yaml` | ArgoCD Project with RBAC policies |
| `application-dev.yaml` | Dev app with auto-sync enabled |
| `application-prod.yaml` | Prod app with manual sync only |
| `image-updater.yaml` | Config for automatic image updates |

## Git Branching Strategy

```
feature/* ──┬──► dev ──────────────► main ──────────► Release
            │      │                   │
            │      ▼                   ▼
            │   Build :dev          Build :latest
            │      │                   │
            │      ▼                   ▼
            │   ArgoCD              ArgoCD
            │   Auto-sync           Manual sync
            │      │                   │
            │      ▼                   ▼
            │   DEV ENV             PROD ENV
            │   :30001              :30000
```

| Branch | Image Tag | ArgoCD App | Sync Mode |
|--------|-----------|------------|-----------|
| `dev` | `:dev` | exam-study-app-dev | Auto |
| `main` | `:latest` | exam-study-app-prod | Manual |

## Deployment Flow

### Dev Environment (Automatic)

```
1. Push code to dev branch
2. GitHub Actions builds :dev image
3. ArgoCD detects change (watches dev branch)
4. Auto-syncs to exam-study-dev namespace
5. App available at http://localhost:30001
```

### Prod Environment (Manual)

```
1. Merge dev → main
2. Create GitHub Release (v1.0.0)
3. GitHub Actions builds :latest and :v1.0.0 images
4. ArgoCD shows "OutOfSync" status
5. Admin manually syncs via UI or CLI
6. App available at http://localhost:30000
```

### Development Workflow

```bash
# 1. Create dev branch (one-time setup)
git checkout -b dev
git push -u origin dev

# 2. Create feature branch
git checkout dev
git checkout -b feature/my-feature

# 3. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 4. Push to dev → Auto-deploys to dev environment
git checkout dev
git merge feature/my-feature
git push origin dev
# Check: http://localhost:30001

# 5. When ready for prod, merge to main
git checkout main
git merge dev
git push origin main

# 6. Create release → Triggers prod image build
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes"

# 7. Manually sync prod in ArgoCD
kubectl patch application exam-study-app-prod -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
# Check: http://localhost:30000
```

## Common Commands

### Check Status

```bash
# All applications
kubectl get applications -n argocd

# Specific app
kubectl get application exam-study-app-dev -n argocd -o yaml
```

### Sync Applications

```bash
# Sync dev (usually automatic)
kubectl patch application exam-study-app-dev -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Sync prod (manual approval)
kubectl patch application exam-study-app-prod -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
```

### View Logs

```bash
# ArgoCD controller logs
kubectl logs deployment/argocd-application-controller -n argocd

# Dev app logs
kubectl logs -f deployment/exam-study-app -n exam-study-dev

# Prod app logs
kubectl logs -f deployment/exam-study-app -n exam-study-prod
```

### Rollback

```bash
# View history
kubectl get application exam-study-app-prod -n argocd \
  -o jsonpath='{.status.history}' | jq

# Rollback to previous revision
argocd app rollback exam-study-app-prod
```

## Kustomize Overlays

The configuration uses Kustomize overlays for environment-specific settings:

```
k8s/
├── base/                    # Shared manifests
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── postgres/
│   └── app/
│
├── overlays/
│   ├── dev/                 # Dev-specific
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │
│   └── prod/                # Prod-specific
│       ├── kustomization.yaml
│       └── patches/
```

### Key Differences

| Setting | Dev | Prod |
|---------|-----|------|
| Replicas | 1 | 2 |
| Image tag | :dev | :latest |
| Memory limit | 256Mi | 512Mi |
| PVC size | 1Gi | 10Gi |
| NODE_ENV | development | production |
| Sync | Auto | Manual |

## Testing Locally

```bash
# Test dev overlay
kubectl kustomize k8s/overlays/dev

# Test prod overlay
kubectl kustomize k8s/overlays/prod

# Apply dev without ArgoCD (for testing)
kubectl apply -k k8s/overlays/dev
```

## CKAD/CKS Topics Covered

### CKAD
- Kustomize overlays
- ConfigMaps and Secrets
- Resource management
- Multi-environment deployments
- GitOps patterns

### CKS
- RBAC (ArgoCD roles)
- Namespace isolation
- Supply chain security
- Sync policies and windows
- Audit logging

## Troubleshooting

### App Stuck in "Progressing"

```bash
# Check events
kubectl describe application exam-study-app-dev -n argocd

# Check pod status
kubectl get pods -n exam-study-dev
kubectl describe pod <pod-name> -n exam-study-dev
```

### Sync Failed

```bash
# View sync result
kubectl get application exam-study-app-dev -n argocd \
  -o jsonpath='{.status.operationState.message}'

# Force refresh
argocd app get exam-study-app-dev --refresh
```

### Image Not Updating

```bash
# Check image updater logs
kubectl logs deployment/argocd-image-updater -n argocd

# Manual image update
argocd app set exam-study-app-dev \
  --kustomize-image ghcr.io/YOUR_USERNAME/exam-study-app:new-tag
```
