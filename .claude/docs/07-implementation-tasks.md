# Implementation Tasks

## Overview

This document breaks down the implementation into phases with detailed tasks. Each phase includes references to documentation files that should be read before starting.

---

## Phase 1: Project Foundation

### Required Reading
Before starting this phase, read:
- `02-technical-architecture.md` - Full tech stack, project structure
- `03-data-schema.md` - Prisma schema definition
- `08-deployment-guide.md` - Docker configuration, environment variables

### 1.1 Project Setup

- [x] Create Next.js 16 project with TypeScript
  ```bash
  npx create-next-app@latest exam-study-app --typescript --tailwind --eslint --app --src-dir
  ```
- [x] Configure `tsconfig.json` with strict mode
- [x] Set up path aliases (`@/components`, `@/lib`, etc.)
- [x] Create `.env.example` with required variables

### 1.2 Styling Setup

**Read:** `05-frontend-design.md` (Design System section)
- [x] Initialize shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [x] Configure dark theme as default
- [x] Install core components: Button, Card, Badge, Input, Dialog
- [x] Set up global CSS variables

### 1.3 Database Setup (Prisma Only)

**Read:** `03-data-schema.md` (full document)
- [x] Install Prisma
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [x] Create `schema.prisma` with all models (copy from `03-data-schema.md`)
- [x] Set up Prisma client singleton (`lib/prisma.ts`)
- [x] Generate Prisma client (`npx prisma generate`)

### 1.4 PostgreSQL Helm Setup

**Read:** `08-deployment-guide.md` (Kubernetes Configuration section)
- [x] Enable Kubernetes in Docker Desktop
- [x] Create namespaces (`exam-study-dev`, `exam-study-prod`)
- [x] Update `scripts/setup-helm-essentials.sh` and `scripts/setup-helm.sh`:
  - [x] Add Bitnami Helm repo
  - [x] Generate random passwords with `openssl rand`
  - [x] Store credentials in Kubernetes secrets (`postgres-credentials`)
  - [x] Install PostgreSQL via Helm to both namespaces
  - [x] Display credentials summary
- [x] Update `scripts/teardown-helm-essentials.sh` and `scripts/teardown-helm.sh` for cleanup
- [x] Update `scripts/start.sh` with PostgreSQL port-forwards:
  - [x] Dev database on port 5432
  - [x] Prod database on port 5433
- [x] Update `scripts/stop.sh`
- [x] Run initial Prisma migration (`npx prisma migrate dev --name init`)
- [x] Verify with `npx prisma studio`
- [x] **[PR #10]** Remove unused PORT parameter from `setup_postgres()` function
  - Files: `scripts/setup-helm-essentials.sh:77-78`, `scripts/setup-helm.sh:77-78`
- [x] **[PR #10]** Add input validation to `setup_postgres()` function (validate namespace pattern)
  - Files: `scripts/setup-helm-essentials.sh:76-78`, `scripts/setup-helm.sh:76-78`
- [x] **[PR #10]** Address credential exposure: display retrieval instructions instead of plaintext passwords
  - Files: `scripts/setup-helm-essentials.sh:363-377`, `scripts/setup-helm.sh:490-506`

### 1.5 App Kubernetes Setup

**Read:** `08-deployment-guide.md` (Kubernetes Configuration section)
- [x] Create `Dockerfile` for Next.js app
- [x] Create `k8s/base/` directory structure
- [x] Create ConfigMap for app config (`k8s/base/app/configmap.yaml`)
- [x] Create App manifests:
  - [x] Deployment (`k8s/base/app/deployment.yaml`) - references `postgres-credentials` secret
  - [x] Service (`k8s/base/app/service.yaml`)
- [x] Create migration Job (`k8s/base/jobs/migration-job.yaml`)
- [x] Test: Build image and deploy to dev namespace
- [x] Create `/api/health` endpoint for Kubernetes probes
- [x] Configure Next.js standalone output
- [x] Create `.dockerignore` for optimized builds
- [x] Update Kustomize overlays for Helm PostgreSQL integration

### 1.6 Basic Layout

**Read:** `05-frontend-design.md` (Page Layouts section)
- [x] Create root layout with providers
- [x] Create sidebar navigation component
- [x] Create header component with theme toggle
- [x] Set up next-themes for dark/light mode

**Deliverables:**
- Working Next.js app with Tailwind + shadcn/ui
- PostgreSQL running via Helm in both dev and prod namespaces
- Random passwords stored securely in Kubernetes secrets
- Basic layout with navigation
- Database migrations applied
- Setup/teardown scripts for PostgreSQL

---

## Phase 2: Admin & Import

### Required Reading
Before starting this phase, read:
- `04-user-flows.md` - Flow 1 (First-Time Setup), Flow 5 (Import Questions)
- `06-api-specification.md` - Exams endpoints, Import endpoints
- `03-data-schema.md` - Exam model, Question model, JSONB structure
- `09-question-format.md` - Markdown question format, parsing rules, validation

### 2.1 Exam Management

**Read:** `06-api-specification.md` (Exams section)
- [x] Create exam list page (`/admin/exams`)
- [x] Create exam form component
- [x] Create new exam page (`/admin/exams/new`)
- [x] Implement `POST /api/exams` endpoint
- [x] Implement `GET /api/exams` endpoint
- [x] Implement `DELETE /api/exams/{id}` endpoint
- [x] Create exam detail page (`/admin/exams/[id]`)
- [x] **[PR #20 - CRITICAL]** Fix N+1 query pattern in GET /api/exams endpoint
  - File: `src/app/api/exams/route.ts:19-60`
  - Note: Replaced with single aggregated raw SQL query using JOINs
  - Reporters: sentry[bot], claude[bot]
- [x] **[PR #20]** Add AbortController cleanup to prevent state updates on unmounted component
  - File: `src/app/admin/exams/page.tsx:19-43`
  - Note: Added AbortController with cleanup on unmount
- [x] **[PR #20]** Parallelize pre-deletion count queries for improved response time
  - File: `src/app/api/exams/[examId]/route.ts:142-155`
  - Note: Count queries now run in parallel using Promise.all
- [x] **[PR #20]** Log caught errors for debugging in exam form
  - File: `src/components/exam/exam-form.tsx:73-74`
  - Note: Added console.error while keeping generic user message
- [x] **[PR #20]** Log caught errors for debugging in exams page
  - File: `src/app/admin/exams/page.tsx:34-35`
  - Note: Added console.error for development debugging
- [x] **[PR #20]** Align accuracy precision consistency in exam stats
  - File: `src/app/api/exams/[examId]/route.ts:76-82`
  - Note: bySection accuracy now uses one decimal precision matching overall accuracy
- [x] **[PR #20]** Transform empty description to undefined/null for API consistency
  - File: `src/components/exam/exam-form.tsx`
  - Note: Empty descriptions now transformed to undefined before API call
- [x] **[PR #20]** Consider using Zod for request validation
  - File: `src/lib/validations/exam.ts` (new), `src/app/api/exams/route.ts`, `src/components/exam/exam-form.tsx`
  - Note: Created shared Zod schemas: `examFormSchema` for frontend, `createExamSchema` with transforms for API
- [x] **[PR #20 - HIGH]** Fix whitespace-only name bypassing validation
  - File: `src/lib/validations/exam.ts`
  - Note: Added `.refine()` after transform to validate trimmed name length
  - Reporter: sentry[bot]
- [x] **[PR #20]** Fix inconsistent empty-string handling between create and update schemas
  - File: `src/lib/validations/exam.ts`
  - Note: Both schemas now consistently convert empty description to null
  - Reporter: coderabbitai[bot]
- [x] **[PR #20 - HIGH]** Add unique constraint on exam name to prevent race condition
  - Files: `prisma/schema.prisma`, `src/app/api/exams/route.ts`
  - Note: Added @unique to Exam.name, created migration, and catch P2002 error in API
  - Reporter: sentry[bot]

### 2.2 ZIP Upload

**Read:** `04-user-flows.md` (Flow 5 - Import Questions)
- [ ] Install react-dropzone
- [ ] Create ImportDropzone component (see `05-frontend-design.md`)
- [ ] Create upload progress indicator
- [ ] Implement file validation (ZIP only, size limit)

### 2.3 Question Parsing

**Read:** `09-question-format.md` (full document), `03-data-schema.md` (Question JSONB Structure)
- [ ] Install adm-zip for extraction
- [ ] Create markdown parser (`lib/parsers/markdown.ts`)
  - [ ] Parse question text
  - [ ] Parse options (A, B, C, D, E)
  - [ ] Parse correct answers
  - [ ] Parse explanation
  - [ ] Parse "why wrong" sections
  - [ ] Parse metadata (section, tags, confidence)
  - [ ] Handle images
- [ ] Create JSON parser (`lib/parsers/json.ts`)
- [ ] Write parser tests

### 2.4 Import API

**Read:** `06-api-specification.md` (Import section)
- [ ] Implement `POST /api/import` endpoint
  - [ ] Save uploaded file to temp
  - [ ] Extract ZIP contents
  - [ ] Parse all .md/.json files
  - [ ] Copy images to public folder
  - [ ] Bulk insert to database
  - [ ] Cleanup temp files
  - [ ] Return import summary
- [ ] Create import page (`/admin/exams/[id]/import`)
- [ ] Show import results (success, skipped, errors)
- [ ] *(Review)* Add input validation for JSONB question data structure
- [ ] *(Review)* Add rate limiting to prevent resource exhaustion

**Deliverables:**
- Admin can create/delete exams
- Admin can upload ZIP files
- Questions parsed and stored in database
- Import shows progress and results

---

## Phase 3: Study Features

### Required Reading
Before starting this phase, read:
- `04-user-flows.md` - Flow 2 (Daily Study), Flow 3 (Quiz Mode)
- `05-frontend-design.md` - QuestionCard, OptionButton, ExplanationPanel components
- `06-api-specification.md` - Questions endpoints, Progress endpoints

### 3.1 Question Display

**Read:** `05-frontend-design.md` (Key Components section)
- [ ] Create QuestionCard component
  - [ ] Question text with markdown support
  - [ ] Section and confidence badges
  - [ ] Tags display
- [ ] Create OptionButton component
  - [ ] Default, selected, correct, wrong states
  - [ ] Support single and multi-select
- [ ] Create ExplanationPanel component
  - [ ] Show correct answer
  - [ ] Show explanation
  - [ ] Show "why wrong" for each option
- [ ] Handle question images

### 3.2 Quiz Mode

**Read:** `04-user-flows.md` (Flow 3 - Quiz Mode)
- [ ] Create exam dashboard (`/study/[examId]`)
  - [ ] Stats summary
  - [ ] Quick action buttons
- [ ] Create quiz page (`/study/[examId]/quiz`)
- [ ] Implement question navigation (prev/next)
- [ ] Implement `GET /api/questions` with filters
- [ ] Implement `GET /api/questions/random`
- [ ] Create quiz settings (filters: section, unanswered, etc.)

### 3.3 Answer Submission

**Read:** `06-api-specification.md` (Progress section)
- [ ] Implement `POST /api/progress/answer`
- [ ] Show immediate feedback (correct/wrong)
- [ ] Track time spent per question
- [ ] Create Answer model records

### 3.4 Keyboard Shortcuts

**Read:** `04-user-flows.md` (Keyboard Shortcuts table)
- [ ] Create useKeyboard hook
- [ ] 1-5 or A-E for option selection
- [ ] Enter for submit
- [ ] Arrow keys for navigation
- [ ] R for reveal answer
- [ ] B for toggle bookmark

### 3.5 Bookmarks

**Read:** `06-api-specification.md` (Bookmarks section)
- [ ] Implement `POST /api/bookmarks/toggle`
- [ ] Implement `GET /api/bookmarks`
- [ ] Add bookmark button to QuestionCard
- [ ] Filter questions by bookmarked

**Deliverables:**
- Full quiz experience
- Answer submission with feedback
- Keyboard navigation
- Bookmarks working

---

## Phase 4: Spaced Repetition

### Required Reading
Before starting this phase, read:
- `04-user-flows.md` - Flow 2 (Daily Study - Review section)
- `06-api-specification.md` - Spaced Repetition section (all endpoints)
- `03-data-schema.md` - SrsCard model

### 4.1 SM-2 Algorithm

**Read:** `06-api-specification.md` (Grade Scale table in SRS section)
- [ ] Create `lib/srs.ts` with SM-2 implementation
  ```typescript
  function calculateSM2(grade, repetitions, easeFactor, interval)
  ```
- [ ] Write SM-2 unit tests
- [ ] Handle edge cases (first review, failed review)

### 4.2 SRS API

**Read:** `06-api-specification.md` (Spaced Repetition section)
- [ ] Implement `GET /api/srs/due`
- [ ] Implement `POST /api/srs/grade`
- [ ] Implement `GET /api/srs/stats`
- [ ] Auto-create SrsCard when question first answered

### 4.3 Review Mode UI

**Read:** `04-user-flows.md` (Flow 2 - Review Mode steps)
- [ ] Create review page (`/study/[examId]/review`)
- [ ] Show question without options first
- [ ] Reveal answer on action
- [ ] Create grade buttons (Again, Hard, Good, Easy)
- [ ] Map buttons to SM-2 grades (0, 2, 4, 5)
- [ ] Show remaining cards count
- [ ] Show next review date after grading

### 4.4 Review Session

- [ ] Track review session progress
- [ ] Show session summary on completion
- [ ] Display "no cards due" when empty

**Deliverables:**
- SM-2 algorithm working
- Review mode with grading
- SRS scheduling questions correctly

---

## Phase 5: Analytics & Progress

### Required Reading
Before starting this phase, read:
- `04-user-flows.md` - Flow 4 (Analytics Review), Flow 6 (Export/Import Progress)
- `05-frontend-design.md` - Charts section (Recharts examples)
- `06-api-specification.md` - Analytics section, Export/Import Progress section
- `03-data-schema.md` - Common Queries section, StudyProgress model

### 5.1 Analytics API

**Read:** `06-api-specification.md` (Analytics section)
- [ ] Implement `GET /api/analytics/accuracy`
- [ ] Implement `GET /api/analytics/sections`
- [ ] Implement `GET /api/analytics/weak-areas`
- [ ] Complex queries with Prisma raw SQL where needed
- [ ] *(Review)* Add rate limiting on heavy analytics queries

### 5.2 Charts

**Read:** `05-frontend-design.md` (Charts section)
- [ ] Install Recharts
- [ ] Create AccuracyTrendChart component
- [ ] Create SectionBreakdownChart component
- [ ] Create ReadinessGauge component
- [ ] Create WeakAreasList component

### 5.3 Analytics Page

**Read:** `04-user-flows.md` (Flow 4 - Analytics Review wireframe)
- [ ] Create analytics page (`/study/[examId]/analytics`)
- [ ] Layout with responsive grid
- [ ] Loading states with skeletons
- [ ] Error handling

### 5.4 Progress Export/Import

**Read:** `06-api-specification.md` (Export/Import Progress section)
**Read:** `03-data-schema.md` (StudyProgress JSONB Structure)
- [ ] Implement `GET /api/export/progress`
- [ ] Implement `POST /api/import/progress`
- [ ] Create progress management page (`/admin/progress`)
- [ ] Export button with file download
- [ ] Import dropzone with validation
- [ ] Confirmation dialog before overwrite

**Deliverables:**
- Analytics dashboard with charts
- Weak areas identification
- Progress export/import working

---

## Phase 6: Polish & PWA

### Required Reading
Before starting this phase, read:
- `01-product-description.md` - Success Metrics section
- `05-frontend-design.md` - Responsive Breakpoints, Mobile Adaptations, Accessibility
- `08-deployment-guide.md` - Full document for production readiness

### 6.1 PWA Setup

- [ ] Install next-pwa
- [ ] Create `manifest.json`
- [ ] Create app icons (multiple sizes)
- [ ] Configure service worker caching
- [ ] Test offline functionality

### 6.2 Theme System

**Read:** `05-frontend-design.md` (Colors section)
- [ ] Ensure dark/light theme works everywhere
- [ ] Add system preference detection
- [ ] Persist theme preference
- [ ] Smooth transitions

### 6.3 Mobile Responsive

**Read:** `05-frontend-design.md` (Responsive Breakpoints, Mobile Adaptations)
**Read:** `04-user-flows.md` (Mobile Considerations)
- [ ] Test all pages on mobile viewport
- [ ] Adjust sidebar for mobile (bottom nav or hamburger)
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Full-screen quiz mode on mobile

### 6.4 Error Handling & Browser Compatibility

**Read:** `05-frontend-design.md` (Error States section)
**Read:** `06-api-specification.md` (Error Responses section)
- [ ] Global error boundary
- [ ] Toast notifications for actions
- [ ] Form validation messages
- [ ] API error handling
- [ ] Loading states everywhere
- [x] **[PR #20]** Remove unsupported `field-sizing-content` CSS property from textarea
  - File: `src/components/ui/textarea.tsx:5-16`
  - Note: Removed field-sizing-content class due to limited browser support

### 6.5 Performance

- [ ] Optimize bundle size
- [ ] Add React Suspense boundaries
- [ ] Optimize images with next/image
- [ ] Database query optimization
- [ ] Add database indexes (see `03-data-schema.md` - Database Indexes table)

### 6.6 Testing

- [ ] Unit tests for parsers
- [ ] Unit tests for SM-2 algorithm
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (optional)
- [ ] *(Review)* Integration tests for Prisma client operations
- [ ] *(Review)* Test cascade delete behavior (Exam → Questions → Answers)
- [ ] *(Review)* Validate JSONB data structure tests

### 6.7 Dependency Management

**Source:** PR #11 review
- [ ] **[PR #11]** Document dependency update policy/schedule
  - File: `.claude/docs/08-deployment-guide.md` or new `SECURITY.md`
  - Note: OpenSSF Scorecard flagged pg package dependencies; establish review cadence
- [ ] **[PR #11]** Monitor pg package for security updates
  - Note: pg package has transitive dependencies that may need updates
  - Suggestion: Subscribe to pg package releases or use Dependabot alerts

**Deliverables:**
- PWA working with offline support
- Mobile-responsive design
- Polished error handling
- Optimized performance

---

## Phase 7: Advanced Kubernetes (CKAD/CKS Learning)

### Overview
This phase expands Kubernetes knowledge using the exam study app for hands-on practice, covering advanced topics from CKAD (Certified Kubernetes Application Developer) and CKS (Certified Kubernetes Security Specialist) certifications.

### Prerequisites
- Phases 1-4 completed (working app in Kubernetes)
- Basic kubectl familiarity from Phase 1

### 7.1 Health Checks & Probes

**CKAD Topics:** Application Observability and Maintenance
- [ ] Add liveness probe to app deployment (HTTP GET /api/health)
- [ ] Add readiness probe to app deployment
- [ ] Add startup probe for slow-starting containers
- [ ] Add probes to PostgreSQL deployment
- [ ] Test: Kill process, verify restart

### 7.2 Resource Management

**CKAD Topics:** Application Environment, Configuration
- [ ] Add resource requests to all containers
- [ ] Add resource limits to all containers
- [ ] Create LimitRange for namespace (`k8s/base/limit-range.yaml`)
- [ ] Create ResourceQuota for namespace (`k8s/base/resource-quota.yaml`)
- [ ] Test: Exceed quota, verify rejection

### 7.3 Configuration Management

**CKAD Topics:** Application Environment, Configuration
- [ ] Mount ConfigMap as environment variables
- [ ] Mount ConfigMap as volume (config file)
- [ ] Mount Secret as environment variables
- [ ] Practice: Update ConfigMap, rollout restart

### 7.4 Scaling & Updates

**CKAD Topics:** Application Deployment
- [ ] Configure HorizontalPodAutoscaler (`k8s/base/app/hpa.yaml`)
- [ ] Practice: Manual scaling with `kubectl scale`
- [ ] Configure RollingUpdate strategy
- [ ] Practice: Rolling update with new image
- [ ] Practice: Rollback with `kubectl rollout undo`

### 7.5 Ingress Configuration

**CKAD Topics:** Services & Networking
- [ ] Enable NGINX Ingress controller
- [ ] Create Ingress resource (`k8s/base/app/ingress.yaml`)
- [ ] Configure path-based routing
- [ ] Configure TLS termination (self-signed cert)
- [ ] Test: Access app via hostname

### 7.6 Jobs and CronJobs

**CKAD Topics:** Workloads
- [ ] Create database backup Job (`k8s/base/jobs/backup-job.yaml`)
- [ ] Create backup CronJob (daily) (`k8s/base/jobs/backup-cronjob.yaml`)
- [ ] Configure job completion and parallelism
- [ ] Configure activeDeadlineSeconds
- [ ] Test: Manual job run, verify completion

### 7.7 Network Policies (CKS)

**CKS Topics:** Cluster Hardening, System Hardening
- [ ] Create default deny-all ingress policy (`k8s/security/network-policies/default-deny.yaml`)
- [ ] Create policy: app → postgres allowed (`k8s/security/network-policies/allow-app-to-db.yaml`)
- [ ] Create policy: ingress → app allowed (`k8s/security/network-policies/allow-ingress-to-app.yaml`)
- [ ] Create egress policy: restrict external access (`k8s/security/network-policies/restrict-egress.yaml`)
- [ ] Test: Verify network isolation

### 7.8 Pod Security (CKS)

**CKS Topics:** System Hardening, Minimize Microservice Vulnerabilities
- [ ] Add SecurityContext to app deployment:
  - [ ] runAsNonRoot: true
  - [ ] readOnlyRootFilesystem: true
  - [ ] allowPrivilegeEscalation: false
  - [ ] capabilities: drop ALL
- [ ] Add SecurityContext to postgres deployment
- [ ] Enable Pod Security Admission for namespace (restricted)
- [ ] Create security-hardened manifests (`k8s/security/pod-security.yaml`)
- [ ] Test: Verify pods run as non-root

### 7.9 RBAC (CKS)

**CKS Topics:** Cluster Hardening
- [ ] Create ServiceAccount for app (`k8s/security/rbac/serviceaccount.yaml`)
- [ ] Create Role with minimal permissions (`k8s/security/rbac/role.yaml`)
- [ ] Create RoleBinding (`k8s/security/rbac/rolebinding.yaml`)
- [ ] Update deployments to use ServiceAccount
- [ ] Create read-only ClusterRole for monitoring
- [ ] Test: Verify RBAC restrictions

### 7.10 Secrets Security (CKS)

**CKS Topics:** Minimize Microservice Vulnerabilities
- [ ] Audit current secrets usage
- [ ] Practice: Encode/decode secrets
- [ ] Configure secret as volume mount (not env var)
- [ ] Document secrets rotation procedure
- [ ] **[PR #10]** Document PostgreSQL password rotation process in deployment guide
  - File: `.claude/docs/08-deployment-guide.md`
  - Note: Secrets are preserved on re-run for stability; document when/how to rotate

### 7.11 Observability & Troubleshooting

**CKAD Topics:** Application Observability and Maintenance
**CKS Topics:** Monitoring, Logging and Runtime Security
- [ ] Practice: `kubectl logs -f deployment/exam-study-app`
- [ ] Practice: `kubectl exec -it <pod> -- sh`
- [ ] Practice: `kubectl describe pod <pod>`
- [ ] Practice: `kubectl get events --sort-by=.lastTimestamp`
- [ ] Practice: Debug CrashLoopBackOff
- [ ] Practice: Debug ImagePullBackOff
- [ ] Practice: Debug pending pods (resource constraints)

### 7.12 Kustomize

**CKAD Topics:** Application Deployment
- [x] Create base kustomization.yaml (`k8s/base/kustomization.yaml`)
- [x] Create dev overlay (`k8s/overlays/dev/`)
  - [x] Namespace: exam-study-dev
  - [x] Image tag: :dev
  - [x] Reduced resources
  - [x] NodePort: 30001
- [x] Create prod overlay (`k8s/overlays/prod/`)
  - [x] Namespace: exam-study-prod
  - [x] Image tag: :latest
  - [x] Higher resources and replicas
  - [x] NodePort: 30000
- [x] Practice: `kubectl apply -k k8s/overlays/dev/`
- [x] Configure environment-specific patches

### 7.13 ArgoCD GitOps

**CKAD Topics:** Application Deployment, GitOps patterns
**CKS Topics:** Supply Chain Security
- [x] Create ArgoCD project (`k8s/argocd/project.yaml`)
- [x] Create dev Application with auto-sync (`k8s/argocd/application-dev.yaml`)
  - [x] Watches `dev` branch
  - [x] Auto-sync enabled (prune, selfHeal)
  - [x] Deploys to exam-study-dev namespace
- [x] Create prod Application with manual sync (`k8s/argocd/application-prod.yaml`)
  - [x] Watches `main` branch
  - [x] Manual sync only (approval required)
  - [x] Deploys to exam-study-prod namespace
- [x] Configure ArgoCD Image Updater annotations
- [x] Create Helm setup script (`scripts/setup-helm.sh`)
- [x] Create Helm teardown script (`scripts/teardown-helm.sh`)
- [x] Create start/stop scripts (`scripts/start.sh`, `scripts/stop.sh`)
- [x] **[PR #20]** Fix PROJECT_DIR variable used before defined in setup-helm.sh
  - File: `scripts/setup-helm.sh:279,334`
  - Note: Moved SCRIPT_DIR and PROJECT_DIR definitions to early in script (after prerequisites check)
- [ ] Practice: Deploy via ArgoCD UI
- [ ] Practice: Manual sync for prod promotion
- [ ] Practice: Rollback using ArgoCD

### 7.14 GitHub Actions CI/CD

**Topics:** Continuous Integration, Container Security
- [x] Create CI workflow (`.github/workflows/ci.yml`)
  - [x] Lint, typecheck, build, test
  - [x] Parallel jobs with concurrency control
  - [x] PostgreSQL service container for tests
- [x] Create Docker build verification (`.github/workflows/docker-build.yml`)
  - [x] Trivy security scanning
  - [x] Hadolint Dockerfile linting
  - [x] K8s manifest validation (kubeconform)
- [x] Create dev image workflow (`.github/workflows/docker-dev.yml`)
  - [x] Triggers on push to `dev` branch
  - [x] Builds and pushes `:dev` tag to GHCR
- [x] Create prod image workflow (`.github/workflows/docker-publish.yml`)
  - [x] Triggers on GitHub releases
  - [x] Multi-arch builds (amd64, arm64)
  - [x] SBOM generation
  - [x] Pushes `:latest` and version tags
- [x] Create PR checks workflow (`.github/workflows/pr-checks.yml`)
- [x] Create CodeQL security analysis (`.github/workflows/codeql.yml`)
- [x] Create dependency review (`.github/workflows/dependency-review.yml`)
- [x] Configure Dependabot (`.github/dependabot.yml`)
- [x] **[PR #20 - CRITICAL]** Fix CI build failure - DATABASE_URL not set
  - File: `.github/workflows/ci.yml` (Build job)
  - Note: Added dummy DATABASE_URL env var to build step for Prisma client initialization
- [ ] **[PR #11]** Add npm audit step to CI workflow for ongoing security monitoring
  - File: `.github/workflows/ci.yml`
  - Note: Trivy found CVE-2025-64756 in glob package; proactive auditing catches these earlier
- [ ] **[PR #11]** Configure CodeRabbit for non-default branch reviews
  - File: `.coderabbit.yaml`
  - Note: CodeRabbit skipped PR #11 review; enable for `dev` branch
- [ ] Practice: Create PR and observe checks
- [ ] Practice: Create release and observe image build

### 7.15 Practice Exercises

Create hands-on exercises for exam prep:
- [ ] `k8s/exercises/01-create-deployment.md` - Create deployment from scratch
- [ ] `k8s/exercises/02-expose-service.md` - Expose as ClusterIP, NodePort, LoadBalancer
- [ ] `k8s/exercises/03-configure-probes.md` - Add health checks
- [ ] `k8s/exercises/04-configmap-secret.md` - Configuration management
- [ ] `k8s/exercises/05-persistent-storage.md` - PV/PVC setup
- [ ] `k8s/exercises/06-network-policy.md` - Implement network isolation
- [ ] `k8s/exercises/07-rbac.md` - Configure RBAC
- [ ] `k8s/exercises/08-security-context.md` - Harden pod security
- [ ] `k8s/exercises/09-troubleshooting.md` - Debug failing pods
- [ ] `k8s/exercises/10-scaling.md` - HPA and manual scaling

### 7.16 Gateway API Configuration

**Topics:** Kubernetes Gateway API, TLS, Routing
- [ ] **[PR #20]** Fix kubernetes-dashboard HTTPRoute configuration
  - File: `k8s/gateway/httproutes.yaml`
  - Note: HTTPRoute references kubernetes-dashboard service but setup script may not deploy it in same namespace
- [ ] **[PR #20]** Review kustomization file structure for gateway resources
  - File: `k8s/gateway/kustomization.yaml`
  - Note: Ensure all gateway resources are properly included in kustomization
- [ ] **[PR #20]** Configure HTTP to HTTPS redirect on Gateway
  - File: `k8s/gateway/gateway.yaml`
  - Note: HTTP listener on port 80 allows unencrypted traffic; add redirect to HTTPS for better security
- [ ] **[PR #20]** Consider stronger key algorithm for TLS certificate
  - File: `k8s/gateway/certificate.yaml`
  - Note: RSA 2048 is acceptable but RSA 4096 or ECDSA P-256 provides stronger cryptography
- [ ] **[PR #20]** Remove redundant DNS names from certificate
  - File: `k8s/gateway/certificate.yaml`
  - Note: Wildcard `*.local.dev` already covers explicit subdomain entries; remove redundancy

**Deliverables:**
- Production-ready Kubernetes deployment
- Security hardening following CKS best practices
- Practice exercises covering CKAD/CKS topics
- Hands-on experience with real application
- Ready for CKAD/CKS exam practice

---

## Phase 8: Tooling & Documentation

### Overview
This phase covers developer tooling configuration, documentation quality, and Claude Code settings. These are lower priority items that improve developer experience and documentation consistency.

### 8.1 Claude Code Settings

**Topics:** Developer Tooling, Security Configuration
- [x] **[PR #20 - CRITICAL]** Review permission allow/deny rule precedence in settings
  - File: `.claude/settings.json`
  - Note: Confirmed specific allows (curl localhost) correctly override general deny (curl:*); Claude Code uses most-specific-match precedence
- [x] **[PR #20]** Add more comprehensive rm restrictions
  - File: `.claude/settings.json`
  - Note: Added `rm -rf .`, `rm -rf ./`, `rm -rf ..`, `rm -rf ../`, `rm -rf /*` to deny list

### 8.2 Documentation Quality

**Topics:** Markdown Standards, Code Examples
- [ ] **[PR #20]** Add language identifiers to fenced code blocks in pr-followup.md
  - File: `.claude/commands/pr-followup.md:21,58,81,97,305`
  - Note: Missing language specifiers triggers markdownlint warnings
- [ ] **[PR #20]** Fix sidebar active state logic in layout prompt
  - File: `.claude/prompts/06-1.6-basic-layout.md`
  - Note: Condition `pathname.startsWith(item.href)` can mark multiple navigation items as active (e.g., `/admin` and `/admin/exams`)

**Deliverables:**
- Secure Claude Code configuration
- Consistent documentation formatting
- Improved developer experience

---

## Quick Reference: Docs by Topic

| Topic | Primary Doc | Supporting Docs |
|-------|-------------|-----------------|
| **Project structure** | `02-technical-architecture.md` | - |
| **Database models** | `03-data-schema.md` | - |
| **User journeys** | `04-user-flows.md` | `01-product-description.md` |
| **UI components** | `05-frontend-design.md` | `04-user-flows.md` |
| **API endpoints** | `06-api-specification.md` | `03-data-schema.md` |
| **Kubernetes/Deploy** | `08-deployment-guide.md` | `10-infrastructure-access.md` |
| **GitOps/ArgoCD** | `08-deployment-guide.md` | `10-infrastructure-access.md` |
| **Question Format** | `09-question-format.md` | `03-data-schema.md` |
| **Infrastructure Access** | `10-infrastructure-access.md` | - |
| **CI/CD** | `.github/workflows/` | `08-deployment-guide.md` |

---

## Task Checklist Summary

| Phase | Tasks | Priority | Key Docs to Read |
|-------|-------|----------|------------------|
| 1. Foundation | 30 | Critical | 02, 03, 05, 08 |
| 2. Admin & Import | 28 | Critical | 03, 04, 06 |
| 3. Study Features | 22 | Critical | 04, 05, 06 |
| 4. Spaced Repetition | 15 | High | 03, 04, 06 |
| 5. Analytics | 14 | Medium | 03, 04, 05, 06 |
| 6. Polish & PWA | 23 | Medium | 01, 05, 08 |
| 7. Advanced K8s (CKAD/CKS) | 96 | Optional | 08, ArgoCD docs |
| 8. Tooling & Documentation | 4 | Low | - |

**Total: ~232 tasks** (132 core + 96 Kubernetes/GitOps + 4 tooling)

### Phase 7 Breakdown

| Section | Tasks | Status |
|---------|-------|--------|
| 7.1-7.11 Basic K8s | 45 | Pending |
| 7.12 Kustomize | 8 | ✅ Complete |
| 7.13 ArgoCD GitOps | 13 | Mostly Complete |
| 7.14 GitHub Actions | 15 | Mostly Complete |
| 7.15 Practice Exercises | 10 | Pending |
| 7.16 Gateway API | 5 | Pending |

---

## Dependencies Between Phases

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4
   │                        │           │
   │                        ▼           │
   └──────────────────► Phase 5        │
                            │           │
                            ▼           │
                        Phase 6        │
                                       │
                                       ▼
                                   Phase 7
                              (CKAD/CKS Learning)

Phase 8 (Tooling & Docs) ◄── No dependencies, can run anytime
```

- Phase 2 requires Phase 1 (database, layout, Kubernetes basics)
- Phase 3 requires Phase 2 (questions in database)
- Phase 4 requires Phase 3 (answer tracking)
- Phase 5 requires Phase 3 (answer data for analytics)
- Phase 6 can start after Phase 3 is stable
- Phase 7 can start after Phase 4 (working app in Kubernetes)
- Phase 8 has no dependencies (tooling/docs can be fixed anytime)

---

## AI Implementation Instructions

When implementing each phase:

1. **Read required docs first** - Listed at the top of each phase
2. **Follow the schema exactly** - Use `03-data-schema.md` for all Prisma models
3. **Match API spec** - Use `06-api-specification.md` for all endpoints
4. **Use component specs** - Reference `05-frontend-design.md` for UI
5. **Follow user flows** - Validate against `04-user-flows.md` wireframes

### File References for Common Tasks

| Task | Reference File | Section |
|------|----------------|---------|
| Create Prisma model | `03-data-schema.md` | Prisma Schema |
| Add API endpoint | `06-api-specification.md` | (find endpoint) |
| Create component | `05-frontend-design.md` | Key Components |
| Add page/route | `02-technical-architecture.md` | Project Structure |
| Kubernetes config | `08-deployment-guide.md` | Kubernetes Configuration |
| Handle errors | `06-api-specification.md` | Error Responses |
| K8s security (CKS) | `08-deployment-guide.md` | Security Hardening |
| ArgoCD/GitOps | `k8s/argocd/README.md` | Full document |
| Kustomize overlays | `k8s/overlays/` | kustomization.yaml |
| GitHub Actions | `.github/workflows/` | Workflow files |
| Multi-environment | `08-deployment-guide.md` | GitOps with ArgoCD |
