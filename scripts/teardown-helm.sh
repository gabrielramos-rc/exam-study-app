#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Helm Infrastructure Teardown        ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}This will remove:${NC}"
echo "  - ArgoCD (including all applications)"
echo "  - ArgoCD Image Updater"
echo "  - Kubernetes Dashboard"
echo "  - Prometheus + Grafana"
echo "  - Loki"
echo "  - cert-manager"
echo "  - Istio (base + istiod)"
echo "  - Kiali"
echo "  - Envoy Gateway"
echo "  - pgAdmin"
echo "  - Metrics Server"
echo "  - Falco"
echo "  - OPA Gatekeeper"
echo "  - Sealed Secrets"
echo "  - Trivy Operator"
echo "  - Jaeger"
echo ""

read -p "Are you sure you want to continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 0
fi

echo ""

# Remove ArgoCD applications first
echo -e "${YELLOW}Removing ArgoCD applications...${NC}"
kubectl delete applications --all -n argocd 2>/dev/null || true
kubectl delete appprojects --all -n argocd 2>/dev/null || true
echo -e "${GREEN}✓ Applications removed${NC}"

# Uninstall Helm releases
echo ""
echo -e "${YELLOW}Uninstalling Helm releases...${NC}"

if helm status jaeger -n tracing &> /dev/null; then
    helm uninstall jaeger -n tracing
    echo -e "${GREEN}✓ Jaeger uninstalled${NC}"
fi

if helm status trivy-operator -n trivy-system &> /dev/null; then
    helm uninstall trivy-operator -n trivy-system
    echo -e "${GREEN}✓ Trivy Operator uninstalled${NC}"
fi

if helm status sealed-secrets -n kube-system &> /dev/null; then
    helm uninstall sealed-secrets -n kube-system
    echo -e "${GREEN}✓ Sealed Secrets uninstalled${NC}"
fi

if helm status gatekeeper -n gatekeeper-system &> /dev/null; then
    helm uninstall gatekeeper -n gatekeeper-system
    echo -e "${GREEN}✓ OPA Gatekeeper uninstalled${NC}"
fi

if helm status falco -n falco &> /dev/null; then
    helm uninstall falco -n falco
    echo -e "${GREEN}✓ Falco uninstalled${NC}"
fi

if helm status metrics-server -n kube-system &> /dev/null; then
    helm uninstall metrics-server -n kube-system
    echo -e "${GREEN}✓ Metrics Server uninstalled${NC}"
fi

if helm status pgadmin -n pgadmin &> /dev/null; then
    helm uninstall pgadmin -n pgadmin
    echo -e "${GREEN}✓ pgAdmin uninstalled${NC}"
fi

if helm status kiali-server -n istio-system &> /dev/null; then
    helm uninstall kiali-server -n istio-system
    echo -e "${GREEN}✓ Kiali uninstalled${NC}"
fi

if helm status istiod -n istio-system &> /dev/null; then
    helm uninstall istiod -n istio-system
    echo -e "${GREEN}✓ Istiod uninstalled${NC}"
fi

if helm status istio-base -n istio-system &> /dev/null; then
    helm uninstall istio-base -n istio-system
    echo -e "${GREEN}✓ Istio base uninstalled${NC}"
fi

if helm status cert-manager -n cert-manager &> /dev/null; then
    helm uninstall cert-manager -n cert-manager
    echo -e "${GREEN}✓ cert-manager uninstalled${NC}"
fi

if helm status eg -n envoy-gateway-system &> /dev/null; then
    helm uninstall eg -n envoy-gateway-system
    echo -e "${GREEN}✓ Envoy Gateway uninstalled${NC}"
fi

if helm status loki -n monitoring &> /dev/null; then
    helm uninstall loki -n monitoring
    echo -e "${GREEN}✓ Loki uninstalled${NC}"
fi

if helm status prometheus -n monitoring &> /dev/null; then
    helm uninstall prometheus -n monitoring
    echo -e "${GREEN}✓ Prometheus + Grafana uninstalled${NC}"
fi

if helm status argocd-image-updater -n argocd &> /dev/null; then
    helm uninstall argocd-image-updater -n argocd
    echo -e "${GREEN}✓ ArgoCD Image Updater uninstalled${NC}"
fi

if helm status argocd -n argocd &> /dev/null; then
    helm uninstall argocd -n argocd
    echo -e "${GREEN}✓ ArgoCD uninstalled${NC}"
fi

if helm status kubernetes-dashboard -n kubernetes-dashboard &> /dev/null; then
    helm uninstall kubernetes-dashboard -n kubernetes-dashboard
    echo -e "${GREEN}✓ Kubernetes Dashboard uninstalled${NC}"
fi

# Delete namespaces
echo ""
echo -e "${YELLOW}Deleting namespaces...${NC}"
kubectl delete namespace argocd --wait=false 2>/dev/null || true
kubectl delete namespace kubernetes-dashboard --wait=false 2>/dev/null || true
kubectl delete namespace monitoring --wait=false 2>/dev/null || true
kubectl delete namespace envoy-gateway-system --wait=false 2>/dev/null || true
kubectl delete namespace pgadmin --wait=false 2>/dev/null || true
kubectl delete namespace istio-system --wait=false 2>/dev/null || true
kubectl delete namespace cert-manager --wait=false 2>/dev/null || true
kubectl delete namespace falco --wait=false 2>/dev/null || true
kubectl delete namespace gatekeeper-system --wait=false 2>/dev/null || true
kubectl delete namespace trivy-system --wait=false 2>/dev/null || true
kubectl delete namespace tracing --wait=false 2>/dev/null || true

# Clean up cluster resources
echo ""
echo -e "${YELLOW}Cleaning up cluster resources...${NC}"
kubectl delete clusterrolebinding admin-user 2>/dev/null || true

# Clean up ArgoCD CRDs
kubectl delete crd applications.argoproj.io 2>/dev/null || true
kubectl delete crd applicationsets.argoproj.io 2>/dev/null || true
kubectl delete crd appprojects.argoproj.io 2>/dev/null || true
kubectl delete crd imageupdaters.argocd-image-updater.argoproj.io 2>/dev/null || true

# Clean up Prometheus CRDs
kubectl delete crd alertmanagerconfigs.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd alertmanagers.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd podmonitors.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd probes.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd prometheusagents.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd prometheuses.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd prometheusrules.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd scrapeconfigs.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd servicemonitors.monitoring.coreos.com 2>/dev/null || true
kubectl delete crd thanosrulers.monitoring.coreos.com 2>/dev/null || true

# Clean up Gateway API CRDs
kubectl delete crd gatewayclasses.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd gateways.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd httproutes.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd referencegrants.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd grpcroutes.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd tcproutes.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd tlsroutes.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd udproutes.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd backendtlspolicies.gateway.networking.k8s.io 2>/dev/null || true
kubectl delete crd backendlbpolicies.gateway.networking.k8s.io 2>/dev/null || true

# Clean up Envoy Gateway CRDs
kubectl get crd -o name | grep gateway.envoyproxy.io | xargs -r kubectl delete 2>/dev/null || true

# Clean up Kong CRDs (from K8s Dashboard)
kubectl get crd -o name | grep konghq.com | xargs -r kubectl delete 2>/dev/null || true

# Clean up cert-manager CRDs
kubectl delete crd certificates.cert-manager.io 2>/dev/null || true
kubectl delete crd certificaterequests.cert-manager.io 2>/dev/null || true
kubectl delete crd challenges.acme.cert-manager.io 2>/dev/null || true
kubectl delete crd clusterissuers.cert-manager.io 2>/dev/null || true
kubectl delete crd issuers.cert-manager.io 2>/dev/null || true
kubectl delete crd orders.acme.cert-manager.io 2>/dev/null || true

# Clean up Istio CRDs (partial list - main ones)
kubectl get crd -o name | grep istio.io | xargs -r kubectl delete 2>/dev/null || true

# Clean up Gatekeeper CRDs
kubectl get crd -o name | grep gatekeeper.sh | xargs -r kubectl delete 2>/dev/null || true

# Clean up Sealed Secrets CRDs
kubectl delete crd sealedsecrets.bitnami.com 2>/dev/null || true

# Clean up Trivy Operator CRDs
kubectl get crd -o name | grep aquasecurity.github.io | xargs -r kubectl delete 2>/dev/null || true

# Clean up Jaeger CRDs
kubectl get crd -o name | grep jaegertracing.io | xargs -r kubectl delete 2>/dev/null || true

# Clean up Falco CRDs
kubectl get crd -o name | grep falco | xargs -r kubectl delete 2>/dev/null || true

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Teardown Complete!                  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Remaining Helm releases:${NC}"
helm list -A
echo ""
echo -e "${YELLOW}To reinstall, run:${NC}"
echo "  ./scripts/setup-helm.sh"
