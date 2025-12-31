#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Helm Infrastructure Setup           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "This script installs:"
echo "  - ArgoCD (GitOps)"
echo "  - ArgoCD Image Updater"
echo "  - Kubernetes Dashboard"
echo "  - Prometheus + Grafana (Monitoring)"
echo "  - Loki (Log Aggregation)"
echo "  - Envoy Gateway (Gateway API)"
echo "  - cert-manager (TLS Certificates)"
echo "  - Istio (Service Mesh)"
echo "  - Kiali (Istio Dashboard)"
echo "  - pgAdmin (PostgreSQL UI)"
echo "  - Metrics Server (kubectl top)"
echo "  - Falco (Runtime Security)"
echo "  - OPA Gatekeeper (Policy)"
echo "  - Sealed Secrets (Encrypted Secrets)"
echo "  - Trivy Operator (Vulnerability Scanning)"
echo "  - Jaeger (Distributed Tracing)"
echo "  - PostgreSQL (Dev + Prod databases)"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${RED}Error: helm is not installed${NC}"
    echo "Install with: brew install helm"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo "Make sure Docker Desktop Kubernetes is enabled"
    exit 1
fi

echo -e "${GREEN}✓ kubectl and helm are installed and connected${NC}"

# Define project directory early (used by gateway and argocd setup)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Step 1: Add Helm repos
echo ""
echo -e "${YELLOW}Step 1: Adding Helm repositories...${NC}"
helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/ 2>/dev/null || true
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
helm repo add jetstack https://charts.jetstack.io 2>/dev/null || true
helm repo add istio https://istio-release.storage.googleapis.com/charts 2>/dev/null || true
helm repo add kiali https://kiali.org/helm-charts 2>/dev/null || true
helm repo add runix https://helm.runix.net 2>/dev/null || true
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ 2>/dev/null || true
helm repo add falcosecurity https://falcosecurity.github.io/charts 2>/dev/null || true
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts 2>/dev/null || true
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets 2>/dev/null || true
helm repo add aqua https://aquasecurity.github.io/helm-charts/ 2>/dev/null || true
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts 2>/dev/null || true
helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
helm repo update
echo -e "${GREEN}✓ Helm repos added${NC}"

# Step 1.5: Install PostgreSQL in dev and prod namespaces
echo ""
echo -e "${YELLOW}Step 1.5: Installing PostgreSQL databases...${NC}"

# Source shared PostgreSQL setup function
SCRIPT_DIR_TEMP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR_TEMP}/lib/postgres-helpers.sh"

# Setup PostgreSQL in both namespaces
kubectl create namespace exam-study-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace exam-study-prod --dry-run=client -o yaml | kubectl apply -f -

setup_postgres "exam-study-dev"
setup_postgres "exam-study-prod"

echo -e "${GREEN}✓ PostgreSQL installed in both namespaces${NC}"

# Step 2: Install ArgoCD
echo ""
echo -e "${YELLOW}Step 2: Installing ArgoCD...${NC}"
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

if helm status argocd -n argocd &> /dev/null; then
    echo -e "${YELLOW}ArgoCD already installed, upgrading...${NC}"
    helm upgrade argocd argo/argo-cd --namespace argocd --wait
else
    helm install argocd argo/argo-cd --namespace argocd --wait
fi
echo -e "${GREEN}✓ ArgoCD installed${NC}"

# Step 3: Install ArgoCD Image Updater
echo ""
echo -e "${YELLOW}Step 3: Installing ArgoCD Image Updater...${NC}"
if helm status argocd-image-updater -n argocd &> /dev/null; then
    echo -e "${YELLOW}Image Updater already installed, upgrading...${NC}"
    helm upgrade argocd-image-updater argo/argocd-image-updater --namespace argocd --wait
else
    helm install argocd-image-updater argo/argocd-image-updater --namespace argocd --wait
fi
echo -e "${GREEN}✓ ArgoCD Image Updater installed${NC}"

# Step 4: Install Kubernetes Dashboard
echo ""
echo -e "${YELLOW}Step 4: Installing Kubernetes Dashboard...${NC}"
kubectl create namespace kubernetes-dashboard --dry-run=client -o yaml | kubectl apply -f -

if helm status kubernetes-dashboard -n kubernetes-dashboard &> /dev/null; then
    echo -e "${YELLOW}Dashboard already installed, upgrading...${NC}"
    helm upgrade kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --namespace kubernetes-dashboard --wait
else
    helm install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --namespace kubernetes-dashboard --wait
fi
echo -e "${GREEN}✓ Kubernetes Dashboard installed${NC}"

# Step 5: Create Dashboard admin user
echo ""
echo -e "${YELLOW}Step 5: Creating Dashboard admin user...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF
echo -e "${GREEN}✓ Admin user created${NC}"

# Step 6: Install Prometheus + Grafana
echo ""
echo -e "${YELLOW}Step 6: Installing Prometheus + Grafana...${NC}"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Generate or retrieve Grafana password
if kubectl get secret prometheus-grafana -n monitoring &> /dev/null; then
    GRAFANA_PASSWORD=$(kubectl get secret prometheus-grafana -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d)
    echo -e "${YELLOW}Using existing Grafana password from secret${NC}"
else
    GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    echo -e "${YELLOW}Generated new Grafana password${NC}"
fi

if helm status prometheus -n monitoring &> /dev/null; then
    echo -e "${YELLOW}Prometheus already installed, upgrading...${NC}"
    helm upgrade prometheus prometheus-community/kube-prometheus-stack --namespace monitoring \
        --set grafana.adminPassword="$GRAFANA_PASSWORD" \
        --set prometheus-node-exporter.hostRootFsMount.enabled=false \
        --set prometheus-node-exporter.hostRootFsMount.mountPropagation="" \
        --wait
else
    # Note: hostRootFsMount disabled for Docker Desktop compatibility
    helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring \
        --set grafana.adminPassword="$GRAFANA_PASSWORD" \
        --set prometheus-node-exporter.hostRootFsMount.enabled=false \
        --set prometheus-node-exporter.hostRootFsMount.mountPropagation="" \
        --wait
fi
echo -e "${GREEN}✓ Prometheus + Grafana installed${NC}"

# Step 7: Install Loki
echo ""
echo -e "${YELLOW}Step 7: Installing Loki (log aggregation)...${NC}"
if helm status loki -n monitoring &> /dev/null; then
    echo -e "${YELLOW}Loki already installed, upgrading...${NC}"
    helm upgrade loki grafana/loki-stack --namespace monitoring \
        --set grafana.enabled=false \
        --set prometheus.enabled=false \
        --wait
else
    helm install loki grafana/loki-stack --namespace monitoring \
        --set grafana.enabled=false \
        --set prometheus.enabled=false \
        --wait
fi
echo -e "${GREEN}✓ Loki installed${NC}"

# Step 8: Install cert-manager
echo ""
echo -e "${YELLOW}Step 8: Installing cert-manager...${NC}"
if helm status cert-manager -n cert-manager &> /dev/null; then
    echo -e "${YELLOW}cert-manager already installed, upgrading...${NC}"
    helm upgrade cert-manager jetstack/cert-manager --namespace cert-manager \
        --set crds.enabled=true \
        --wait
else
    helm install cert-manager jetstack/cert-manager --namespace cert-manager \
        --create-namespace \
        --set crds.enabled=true \
        --wait
fi
echo -e "${GREEN}✓ cert-manager installed${NC}"

# Step 9: Install Istio
echo ""
echo -e "${YELLOW}Step 9: Installing Istio (service mesh)...${NC}"
kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -

if helm status istio-base -n istio-system &> /dev/null; then
    echo -e "${YELLOW}Istio base already installed, upgrading...${NC}"
    helm upgrade istio-base istio/base -n istio-system --wait
else
    helm install istio-base istio/base -n istio-system --wait
fi

if helm status istiod -n istio-system &> /dev/null; then
    echo -e "${YELLOW}Istiod already installed, upgrading...${NC}"
    helm upgrade istiod istio/istiod -n istio-system --wait
else
    helm install istiod istio/istiod -n istio-system --wait
fi
echo -e "${GREEN}✓ Istio installed${NC}"

# Step 10: Install Kiali
echo ""
echo -e "${YELLOW}Step 10: Installing Kiali (Istio dashboard)...${NC}"
if helm status kiali-server -n istio-system &> /dev/null; then
    echo -e "${YELLOW}Kiali already installed, upgrading...${NC}"
    helm upgrade kiali-server kiali/kiali-server -n istio-system \
        --set auth.strategy=anonymous \
        --set external_services.prometheus.url=http://prometheus-kube-prometheus-prometheus.monitoring:9090 \
        --set external_services.grafana.url=http://prometheus-grafana.monitoring:80 \
        --wait
else
    helm install kiali-server kiali/kiali-server -n istio-system \
        --set auth.strategy=anonymous \
        --set external_services.prometheus.url=http://prometheus-kube-prometheus-prometheus.monitoring:9090 \
        --set external_services.grafana.url=http://prometheus-grafana.monitoring:80 \
        --wait
fi
echo -e "${GREEN}✓ Kiali installed${NC}"

# Step 11: Install Envoy Gateway
echo ""
echo -e "${YELLOW}Step 11: Installing Envoy Gateway...${NC}"
if helm status envoy-gateway -n envoy-gateway-system &> /dev/null; then
    echo -e "${YELLOW}Envoy Gateway already installed, upgrading...${NC}"
    helm upgrade envoy-gateway oci://docker.io/envoyproxy/gateway-helm --version v1.3.0 -n envoy-gateway-system --wait
else
    helm install envoy-gateway oci://docker.io/envoyproxy/gateway-helm --version v1.3.0 -n envoy-gateway-system --create-namespace --wait
fi
echo -e "${GREEN}✓ Envoy Gateway installed${NC}"

# Step 11.5: Configure Gateway API
echo ""
echo -e "${YELLOW}Step 11.5: Configuring Gateway API with TLS...${NC}"

# Wait for Envoy Gateway to be ready
kubectl rollout status deployment/envoy-gateway -n envoy-gateway-system --timeout=60s 2>/dev/null || true

# Apply Gateway manifests
if [ -d "${PROJECT_DIR}/k8s/gateway" ]; then
    kubectl apply -k "${PROJECT_DIR}/k8s/gateway"
    echo -e "${GREEN}✓ Gateway API configured${NC}"

    # Wait for certificate to be ready
    echo -e "${YELLOW}Waiting for TLS certificate...${NC}"
    kubectl wait --for=condition=Ready certificate/local-wildcard-cert -n gateway --timeout=60s 2>/dev/null || true

    # Wait for Gateway to be programmed
    sleep 5
    kubectl wait --for=condition=Programmed gateway/main-gateway -n gateway --timeout=60s 2>/dev/null || true
    echo -e "${GREEN}✓ Gateway ready with TLS${NC}"
else
    echo -e "${YELLOW}⚠ k8s/gateway directory not found, skipping Gateway API setup${NC}"
fi

# Step 12: Install pgAdmin
echo ""
echo -e "${YELLOW}Step 12: Installing pgAdmin...${NC}"
kubectl create namespace pgadmin --dry-run=client -o yaml | kubectl apply -f -

# Generate or retrieve pgAdmin password
if kubectl get secret pgadmin-pgadmin4 -n pgadmin &> /dev/null; then
    PGADMIN_PASSWORD=$(kubectl get secret pgadmin-pgadmin4 -n pgadmin -o jsonpath='{.data.password}' | base64 -d)
    echo -e "${YELLOW}Using existing pgAdmin password from secret${NC}"
else
    PGADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    echo -e "${YELLOW}Generated new pgAdmin password${NC}"
fi

if helm status pgadmin -n pgadmin &> /dev/null; then
    echo -e "${YELLOW}pgAdmin already installed, upgrading...${NC}"
    helm upgrade pgadmin runix/pgadmin4 --namespace pgadmin \
        --set env.email=gabriel.ramos@rcconsultech.com \
        --set env.password="$PGADMIN_PASSWORD" \
        --set persistentVolume.enabled=false \
        --set service.type=NodePort \
        --set service.nodePort=30200
else
    # Note: Must use valid email domain (not .local) for pgAdmin 9.8+
    helm install pgadmin runix/pgadmin4 --namespace pgadmin \
        --set env.email=gabriel.ramos@rcconsultech.com \
        --set env.password="$PGADMIN_PASSWORD" \
        --set persistentVolume.enabled=false \
        --set service.type=NodePort \
        --set service.nodePort=30200
fi
# Wait for pgAdmin to be ready
kubectl rollout status deployment/pgadmin-pgadmin4 -n pgadmin --timeout=120s 2>/dev/null || true
echo -e "${GREEN}✓ pgAdmin installed${NC}"

# Step 13: Apply ArgoCD applications
echo ""
echo -e "${YELLOW}Step 13: Applying ArgoCD applications...${NC}"

if [ -f "${PROJECT_DIR}/k8s/argocd/project.yaml" ]; then
    kubectl apply -f "${PROJECT_DIR}/k8s/argocd/project.yaml"
    kubectl apply -f "${PROJECT_DIR}/k8s/argocd/application-dev.yaml"
    kubectl apply -f "${PROJECT_DIR}/k8s/argocd/application-prod.yaml"
    echo -e "${GREEN}✓ ArgoCD applications created${NC}"
else
    echo -e "${YELLOW}⚠ ArgoCD application files not found, skipping...${NC}"
fi

# Step 14: Install Metrics Server
echo ""
echo -e "${YELLOW}Step 14: Installing Metrics Server...${NC}"
if helm status metrics-server -n kube-system &> /dev/null; then
    echo -e "${YELLOW}Metrics Server already installed, upgrading...${NC}"
    helm upgrade metrics-server metrics-server/metrics-server -n kube-system \
        --set args[0]="--kubelet-insecure-tls" \
        --wait
else
    helm install metrics-server metrics-server/metrics-server -n kube-system \
        --set args[0]="--kubelet-insecure-tls" \
        --wait
fi
echo -e "${GREEN}✓ Metrics Server installed (kubectl top now available)${NC}"

# Step 15: Install Falco
echo ""
echo -e "${YELLOW}Step 15: Installing Falco (runtime security)...${NC}"
kubectl create namespace falco --dry-run=client -o yaml | kubectl apply -f -
if helm status falco -n falco &> /dev/null; then
    echo -e "${YELLOW}Falco already installed, upgrading...${NC}"
    helm upgrade falco falcosecurity/falco -n falco \
        --set falcosidekick.enabled=true \
        --set driver.kind=modern_ebpf \
        --wait --timeout 5m
else
    helm install falco falcosecurity/falco -n falco \
        --set falcosidekick.enabled=true \
        --set driver.kind=modern_ebpf \
        --wait --timeout 5m
fi
echo -e "${GREEN}✓ Falco installed${NC}"

# Step 16: Install OPA Gatekeeper
echo ""
echo -e "${YELLOW}Step 16: Installing OPA Gatekeeper (policy)...${NC}"
if helm status gatekeeper -n gatekeeper-system &> /dev/null; then
    echo -e "${YELLOW}Gatekeeper already installed, upgrading...${NC}"
    helm upgrade gatekeeper gatekeeper/gatekeeper -n gatekeeper-system --wait
else
    helm install gatekeeper gatekeeper/gatekeeper -n gatekeeper-system --create-namespace --wait
fi
echo -e "${GREEN}✓ OPA Gatekeeper installed${NC}"

# Step 17: Install Sealed Secrets
echo ""
echo -e "${YELLOW}Step 17: Installing Sealed Secrets...${NC}"
if helm status sealed-secrets -n kube-system &> /dev/null; then
    echo -e "${YELLOW}Sealed Secrets already installed, upgrading...${NC}"
    helm upgrade sealed-secrets sealed-secrets/sealed-secrets -n kube-system --wait
else
    helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system --wait
fi
echo -e "${GREEN}✓ Sealed Secrets installed${NC}"

# Step 18: Install Trivy Operator
echo ""
echo -e "${YELLOW}Step 18: Installing Trivy Operator (vulnerability scanning)...${NC}"
kubectl create namespace trivy-system --dry-run=client -o yaml | kubectl apply -f -
if helm status trivy-operator -n trivy-system &> /dev/null; then
    echo -e "${YELLOW}Trivy Operator already installed, upgrading...${NC}"
    helm upgrade trivy-operator aqua/trivy-operator -n trivy-system --wait
else
    helm install trivy-operator aqua/trivy-operator -n trivy-system --wait
fi
echo -e "${GREEN}✓ Trivy Operator installed${NC}"

# Step 19: Install Jaeger
echo ""
echo -e "${YELLOW}Step 19: Installing Jaeger (distributed tracing)...${NC}"
kubectl create namespace tracing --dry-run=client -o yaml | kubectl apply -f -
if helm status jaeger -n tracing &> /dev/null; then
    echo -e "${YELLOW}Jaeger already installed, upgrading...${NC}"
    helm upgrade jaeger jaegertracing/jaeger -n tracing \
        --set provisionDataStore.cassandra=false \
        --set allInOne.enabled=true \
        --set storage.type=memory \
        --set agent.enabled=false \
        --set collector.enabled=false \
        --set query.enabled=false \
        --wait
else
    helm install jaeger jaegertracing/jaeger -n tracing \
        --set provisionDataStore.cassandra=false \
        --set allInOne.enabled=true \
        --set storage.type=memory \
        --set agent.enabled=false \
        --set collector.enabled=false \
        --set query.enabled=false \
        --wait
fi
echo -e "${GREEN}✓ Jaeger installed${NC}"

# Step 20: Get credentials
echo ""
echo -e "${YELLOW}Step 20: Retrieving credentials...${NC}"
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
K8S_DASHBOARD_TOKEN=$(kubectl -n kubernetes-dashboard create token admin-user --duration=87600h 2>/dev/null || echo "TOKEN_ERROR")

# Print summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Setup Complete!                     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Helm Releases:${NC}"
helm list -A
echo ""
echo -e "${YELLOW}╔══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║           CREDENTIALS                ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}PostgreSQL (Dev - exam-study-dev):${NC}"
echo "  Host:     postgres-postgresql.exam-study-dev"
echo "  Port:     5432 (cluster) / 5432 (port-forward)"
echo "  Database: study"
echo "  Username: study"
echo "  Password: (stored in secret)"
echo "  Retrieve: kubectl get secret postgres-credentials -n exam-study-dev -o jsonpath='{.data.postgres-password}' | base64 -d"
echo ""
echo -e "${BLUE}PostgreSQL (Prod - exam-study-prod):${NC}"
echo "  Host:     postgres-postgresql.exam-study-prod"
echo "  Port:     5432 (cluster) / 5433 (port-forward)"
echo "  Database: study"
echo "  Username: study"
echo "  Password: (stored in secret)"
echo "  Retrieve: kubectl get secret postgres-credentials -n exam-study-prod -o jsonpath='{.data.postgres-password}' | base64 -d"
echo ""
echo -e "${BLUE}ArgoCD:${NC}"
echo "  URL:      https://localhost:8080"
echo "  Username: admin"
echo "  Password: ${ARGOCD_PASSWORD}"
echo ""
echo -e "${BLUE}Kubernetes Dashboard:${NC}"
echo "  URL:   https://localhost:8443"
echo "  Token: ${K8S_DASHBOARD_TOKEN:0:50}..."
echo ""
echo -e "${BLUE}Grafana:${NC}"
echo "  URL:      http://localhost:3001"
echo "  Username: admin"
echo "  Password: $GRAFANA_PASSWORD"
echo ""
echo -e "${BLUE}pgAdmin:${NC}"
echo "  URL:      http://localhost:30200 (NodePort) or http://localhost:5050 (port-forward)"
echo "  Email:    gabriel.ramos@rcconsultech.com"
echo "  Password: $PGADMIN_PASSWORD"
echo ""
echo -e "${BLUE}Kiali (Istio Dashboard):${NC}"
echo "  URL:      http://localhost:20001"
echo "  Auth:     Anonymous (no login required)"
echo ""
echo -e "${BLUE}Jaeger (Distributed Tracing):${NC}"
echo "  URL:      http://localhost:16686"
echo "  Auth:     Anonymous (no login required)"
echo ""
echo -e "${YELLOW}╔══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║         PORT FORWARDS                ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════╝${NC}"
echo ""
echo "Run ./scripts/start.sh to start all port-forwards, or manually:"
echo ""
echo "  # ArgoCD"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443 &"
echo ""
echo "  # Kubernetes Dashboard"
echo "  kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &"
echo ""
echo "  # Grafana"
echo "  kubectl port-forward svc/prometheus-grafana -n monitoring 3001:80 &"
echo ""
echo "  # pgAdmin"
echo "  kubectl port-forward svc/pgadmin-pgadmin4 -n pgadmin 5050:80 &"
echo ""
echo "  # Kiali"
echo "  kubectl port-forward svc/kiali -n istio-system 20001:20001 &"
echo ""
echo "  # Jaeger"
echo "  kubectl port-forward svc/jaeger -n tracing 16686:16686 &"
echo ""
echo -e "${YELLOW}Application URLs (after deployment):${NC}"
echo "  Dev:  http://localhost:30001"
echo "  Prod: http://localhost:30000"
echo ""
echo -e "${YELLOW}╔══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║       GATEWAY API (TLS)              ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════╝${NC}"
echo ""
echo "To use HTTPS URLs via Gateway API, add to /etc/hosts:"
echo ""
echo "  sudo sh -c 'echo \"127.0.0.1 grafana.local.dev prometheus.local.dev alertmanager.local.dev\" >> /etc/hosts'"
echo "  sudo sh -c 'echo \"127.0.0.1 argocd.local.dev dashboard.local.dev jaeger.local.dev\" >> /etc/hosts'"
echo "  sudo sh -c 'echo \"127.0.0.1 pgadmin.local.dev exam-study.local.dev exam-study-dev.local.dev kiali.local.dev\" >> /etc/hosts'"
echo ""
echo -e "${BLUE}Gateway URLs (HTTPS):${NC}"
echo "  Grafana:      https://grafana.local.dev"
echo "  Prometheus:   https://prometheus.local.dev"
echo "  Alertmanager: https://alertmanager.local.dev"
echo "  ArgoCD:       https://argocd.local.dev"
echo "  Dashboard:    https://dashboard.local.dev"
echo "  Jaeger:       https://jaeger.local.dev"
echo "  pgAdmin:      https://pgadmin.local.dev"
echo "  Kiali:        https://kiali.local.dev"
echo "  App (dev):    https://exam-study-dev.local.dev"
echo "  App (prod):   https://exam-study.local.dev"
echo ""
echo -e "${YELLOW}Note: Browser will show security warning for self-signed certs${NC}"
echo ""
echo -e "${YELLOW}Check status:${NC}"
echo "  kubectl get applications -n argocd"
echo "  kubectl get gateway,httproute -n gateway"
echo "  helm list -A"
echo ""
echo -e "${GREEN}Happy deploying!${NC}"
