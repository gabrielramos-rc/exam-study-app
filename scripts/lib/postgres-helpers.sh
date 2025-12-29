#!/bin/bash
# Shared PostgreSQL setup functions for Helm scripts

# Colors for output (re-declared in case sourced independently)
RED=${RED:-'\033[0;31m'}
GREEN=${GREEN:-'\033[0;32m'}
YELLOW=${YELLOW:-'\033[1;33m'}
NC=${NC:-'\033[0m'}

# Function to setup PostgreSQL in a namespace
# Usage: setup_postgres <namespace>
setup_postgres() {
    local NAMESPACE=$1

    # Validate namespace parameter
    if [[ -z "$NAMESPACE" ]]; then
        echo -e "${RED}Error: NAMESPACE parameter is required${NC}"
        return 1
    fi

    # Validate namespace pattern (lowercase letters, numbers, hyphens, must start with letter)
    if [[ ! "$NAMESPACE" =~ ^[a-z][a-z0-9-]*$ ]]; then
        echo -e "${RED}Error: Invalid namespace format: $NAMESPACE${NC}"
        echo -e "${RED}Namespace must start with a letter and contain only lowercase letters, numbers, and hyphens${NC}"
        return 1
    fi

    echo ""
    echo -e "${YELLOW}Setting up PostgreSQL in ${NAMESPACE}...${NC}"

    # Check if secret already exists (to preserve passwords on re-run)
    if kubectl get secret postgres-credentials -n "$NAMESPACE" &> /dev/null; then
        echo -e "${YELLOW}Using existing postgres-credentials secret${NC}"
        POSTGRES_PASSWORD=$(kubectl get secret postgres-credentials -n "$NAMESPACE" -o jsonpath='{.data.postgres-password}' | base64 -d)
    else
        # Generate random password
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 24)

        # Create secret with credentials
        kubectl create secret generic postgres-credentials \
            --namespace "$NAMESPACE" \
            --from-literal=postgres-password="$POSTGRES_PASSWORD" \
            --from-literal=postgres-user="study" \
            --from-literal=postgres-db="study" \
            --from-literal=database-url="postgresql://study:${POSTGRES_PASSWORD}@postgres-postgresql:5432/study"
        echo -e "${GREEN}✓ Created postgres-credentials secret in ${NAMESPACE}${NC}"
    fi

    # Install or upgrade PostgreSQL
    if helm status postgres -n "$NAMESPACE" &> /dev/null; then
        echo -e "${YELLOW}PostgreSQL already installed in ${NAMESPACE}, upgrading...${NC}"
        helm upgrade postgres bitnami/postgresql --namespace "$NAMESPACE" \
            --set auth.username=study \
            --set auth.password="$POSTGRES_PASSWORD" \
            --set auth.database=study \
            --set primary.persistence.size=5Gi \
            --set primary.resources.requests.memory=256Mi \
            --set primary.resources.requests.cpu=250m \
            --set primary.resources.limits.memory=512Mi \
            --set primary.resources.limits.cpu=500m \
            --wait --timeout 5m
    else
        helm install postgres bitnami/postgresql --namespace "$NAMESPACE" \
            --set auth.username=study \
            --set auth.password="$POSTGRES_PASSWORD" \
            --set auth.database=study \
            --set primary.persistence.size=5Gi \
            --set primary.resources.requests.memory=256Mi \
            --set primary.resources.requests.cpu=250m \
            --set primary.resources.limits.memory=512Mi \
            --set primary.resources.limits.cpu=500m \
            --wait --timeout 5m
    fi
    echo -e "${GREEN}✓ PostgreSQL installed in ${NAMESPACE}${NC}"
}
