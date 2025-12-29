#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Exam Study App - Stop Environment   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kill port-forwards
echo -e "${YELLOW}Stopping port-forwards...${NC}"

# ArgoCD
if pgrep -f "port-forward.*argocd-server" > /dev/null; then
    pkill -f "port-forward.*argocd-server"
    echo -e "${GREEN}✓ ArgoCD port-forward stopped${NC}"
else
    echo "  ArgoCD port-forward was not running"
fi

# Kubernetes Dashboard
if pgrep -f "port-forward.*kubernetes-dashboard" > /dev/null; then
    pkill -f "port-forward.*kubernetes-dashboard"
    echo -e "${GREEN}✓ K8s Dashboard port-forward stopped${NC}"
else
    echo "  K8s Dashboard port-forward was not running"
fi

# Grafana
if pgrep -f "port-forward.*prometheus-grafana" > /dev/null; then
    pkill -f "port-forward.*prometheus-grafana"
    echo -e "${GREEN}✓ Grafana port-forward stopped${NC}"
else
    echo "  Grafana port-forward was not running"
fi

# pgAdmin
if pgrep -f "port-forward.*pgadmin" > /dev/null; then
    pkill -f "port-forward.*pgadmin"
    echo -e "${GREEN}✓ pgAdmin port-forward stopped${NC}"
else
    echo "  pgAdmin port-forward was not running"
fi

# Kiali
if pgrep -f "port-forward.*kiali" > /dev/null; then
    pkill -f "port-forward.*kiali"
    echo -e "${GREEN}✓ Kiali port-forward stopped${NC}"
else
    echo "  Kiali port-forward was not running"
fi

# Jaeger
if pgrep -f "port-forward.*jaeger" > /dev/null; then
    pkill -f "port-forward.*jaeger"
    echo -e "${GREEN}✓ Jaeger port-forward stopped${NC}"
else
    echo "  Jaeger port-forward was not running"
fi

# PostgreSQL (in case it was running)
if pgrep -f "port-forward.*postgres" > /dev/null; then
    pkill -f "port-forward.*postgres"
    echo -e "${GREEN}✓ PostgreSQL port-forward stopped${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Environment Stopped!                ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Note:${NC} Kubernetes pods are still running."
echo "To fully stop everything, you can:"
echo "  - Stop Docker Desktop"
echo "  - Or run: kubectl delete namespace exam-study-dev exam-study-prod"
echo ""

echo -e "${YELLOW}To restart the environment:${NC}"
echo "  ./scripts/start.sh"
echo ""
