#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Exam Study App - Start Environment  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Wait for Kubernetes to be ready
echo -e "${YELLOW}Waiting for Kubernetes cluster...${NC}"
RETRIES=30
until kubectl cluster-info &> /dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo -e "${RED}Error: Kubernetes cluster not available${NC}"
        echo "Make sure Docker Desktop is running with Kubernetes enabled"
        exit 1
    fi
    echo "  Waiting for cluster... ($RETRIES attempts remaining)"
    sleep 2
done
echo -e "${GREEN}✓ Kubernetes cluster is ready${NC}"

# Kill any existing port-forwards
echo ""
echo -e "${YELLOW}Cleaning up existing port-forwards...${NC}"
pkill -f "port-forward.*argocd-server" 2>/dev/null || true
pkill -f "port-forward.*kubernetes-dashboard" 2>/dev/null || true
pkill -f "port-forward.*prometheus-grafana" 2>/dev/null || true
pkill -f "port-forward.*pgadmin" 2>/dev/null || true
pkill -f "port-forward.*kiali" 2>/dev/null || true
pkill -f "port-forward.*jaeger" 2>/dev/null || true
pkill -f "port-forward.*postgres-postgresql" 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Start ArgoCD port-forward
echo ""
echo -e "${YELLOW}Starting port-forwards...${NC}"

# ArgoCD (8080)
if kubectl get svc argocd-server -n argocd &> /dev/null; then
    kubectl port-forward svc/argocd-server -n argocd 8080:443 &> /dev/null &
    sleep 1
    if lsof -i :8080 &> /dev/null; then
        echo -e "${GREEN}✓ ArgoCD:        https://localhost:8080${NC}"
    else
        echo -e "${RED}✗ ArgoCD port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ ArgoCD not installed${NC}"
fi

# Kubernetes Dashboard (8443)
if kubectl get svc kubernetes-dashboard-kong-proxy -n kubernetes-dashboard &> /dev/null; then
    kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &> /dev/null &
    sleep 1
    if lsof -i :8443 &> /dev/null; then
        echo -e "${GREEN}✓ K8s Dashboard: https://localhost:8443${NC}"
    else
        echo -e "${RED}✗ K8s Dashboard port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Kubernetes Dashboard not installed${NC}"
fi

# Grafana (3001)
if kubectl get svc prometheus-grafana -n monitoring &> /dev/null; then
    kubectl port-forward svc/prometheus-grafana -n monitoring 3001:80 &> /dev/null &
    sleep 1
    if lsof -i :3001 &> /dev/null; then
        echo -e "${GREEN}✓ Grafana:       http://localhost:3001${NC}"
    else
        echo -e "${RED}✗ Grafana port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Prometheus/Grafana not installed${NC}"
fi

# pgAdmin (5050 port-forward, or 30200 NodePort)
if kubectl get svc pgadmin-pgadmin4 -n pgadmin &> /dev/null; then
    kubectl port-forward svc/pgadmin-pgadmin4 -n pgadmin 5050:80 &> /dev/null &
    sleep 1
    if lsof -i :5050 &> /dev/null; then
        echo -e "${GREEN}✓ pgAdmin:       http://localhost:5050 (or http://localhost:30200)${NC}"
    else
        echo -e "${RED}✗ pgAdmin port-forward failed (try http://localhost:30200)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ pgAdmin not installed${NC}"
fi

# PostgreSQL Dev (5432)
if kubectl get svc postgres-postgresql -n exam-study-dev &> /dev/null; then
    kubectl port-forward svc/postgres-postgresql -n exam-study-dev 5432:5432 &> /dev/null &
    sleep 1
    if lsof -i :5432 &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL Dev: localhost:5432${NC}"
    else
        echo -e "${RED}✗ PostgreSQL Dev port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL (dev) not installed${NC}"
fi

# PostgreSQL Prod (5433)
if kubectl get svc postgres-postgresql -n exam-study-prod &> /dev/null; then
    kubectl port-forward svc/postgres-postgresql -n exam-study-prod 5433:5432 &> /dev/null &
    sleep 1
    if lsof -i :5433 &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL Prod: localhost:5433${NC}"
    else
        echo -e "${RED}✗ PostgreSQL Prod port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL (prod) not installed${NC}"
fi

# Kiali (20001)
if kubectl get svc kiali -n istio-system &> /dev/null; then
    kubectl port-forward svc/kiali -n istio-system 20001:20001 &> /dev/null &
    sleep 1
    if lsof -i :20001 &> /dev/null; then
        echo -e "${GREEN}✓ Kiali:         http://localhost:20001${NC}"
    else
        echo -e "${RED}✗ Kiali port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Kiali not installed${NC}"
fi

# Jaeger (16686)
if kubectl get svc jaeger -n tracing &> /dev/null; then
    kubectl port-forward svc/jaeger -n tracing 16686:16686 &> /dev/null &
    sleep 1
    if lsof -i :16686 &> /dev/null; then
        echo -e "${GREEN}✓ Jaeger:        http://localhost:16686${NC}"
    else
        echo -e "${RED}✗ Jaeger port-forward failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Jaeger not installed${NC}"
fi

# Show status
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Environment Started!                ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show Gateway status if available
if kubectl get gateway main-gateway -n gateway &> /dev/null; then
    echo -e "${YELLOW}Gateway API Status:${NC}"
    kubectl get gateway -n gateway 2>/dev/null
    echo ""
    echo -e "${BLUE}Gateway URLs (HTTPS):${NC}"
    echo "  Grafana:      https://grafana.local.dev"
    echo "  Prometheus:   https://prometheus.local.dev"
    echo "  Alertmanager: https://alertmanager.local.dev"
    echo "  ArgoCD:       https://argocd.local.dev"
    echo "  Dashboard:    https://dashboard.local.dev"
    echo "  Jaeger:       https://jaeger.local.dev"
    echo "  pgAdmin:      https://pgadmin.local.dev"
    echo "  App (dev):    https://exam-study-dev.local.dev"
    echo "  App (prod):   https://exam-study.local.dev"
    echo ""
    echo -e "${YELLOW}Note: Ensure /etc/hosts has entries for *.local.dev -> 127.0.0.1${NC}"
    echo ""
fi

# Show Helm releases
echo -e "${YELLOW}Helm Releases:${NC}"
helm list -A 2>/dev/null || echo "  (helm not installed or no releases)"
echo ""

# Show ArgoCD applications
echo -e "${YELLOW}ArgoCD Applications:${NC}"
kubectl get applications -n argocd 2>/dev/null || echo "  (no applications found)"
echo ""

# Load credentials from .env if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
if [ -f "${PROJECT_DIR}/.env" ]; then
    echo -e "${YELLOW}Credentials:${NC}"
    ARGOCD_PASSWORD=$(grep ARGOCD_PASSWORD "${PROJECT_DIR}/.env" 2>/dev/null | cut -d '=' -f2)
    echo "  ArgoCD:   admin / ${ARGOCD_PASSWORD:-<see .env>}"
    echo "  K8s Dash: Token from .env (K8S_DASHBOARD_TOKEN)"
    echo "  Grafana:  admin / admin123"
    echo "  pgAdmin:  gabriel.ramos@rcconsultech.com / admin123"
    echo "  Kiali:    Anonymous (no login)"
    echo "  Jaeger:   Anonymous (no login)"
fi
echo ""

echo -e "${YELLOW}Application URLs:${NC}"
echo "  Dev:  http://localhost:30001"
echo "  Prod: http://localhost:30000"
echo ""

echo -e "${YELLOW}To stop the environment:${NC}"
echo "  ./scripts/stop.sh"
echo ""
