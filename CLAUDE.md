# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Study App is a self-hosted Next.js 16 web application for studying certification exam questions with spaced repetition (SM-2 algorithm) and analytics. It's a single-user app designed to run in Kubernetes (Docker Desktop) with PostgreSQL. Also serves as a CKAD/CKS learning platform.

## Commands

```bash
# Development
npm install                      # Install dependencies
kubectl apply -f k8s/base/postgres/  # Start PostgreSQL in K8s
kubectl port-forward svc/postgres 5432:5432 -n exam-study &  # Port-forward DB
npx prisma migrate dev           # Run migrations (dev)
npm run dev                      # Start dev server at localhost:3000

# Production (Kubernetes)
docker build -t exam-study-app:latest .  # Build Docker image
kubectl apply -f k8s/base/       # Deploy all to Kubernetes
kubectl get pods -n exam-study -w  # Watch pod status
open http://localhost:30000      # Access the app

# Database
npx prisma migrate deploy        # Run migrations (prod)
npx prisma studio                # Visual database editor at localhost:5555
kubectl exec -it deploy/postgres -n exam-study -- psql -U study -d study  # Database shell

# Kubernetes Management
kubectl get all -n exam-study    # View all resources
kubectl logs -f deploy/exam-study-app -n exam-study  # View app logs
kubectl rollout restart deploy/exam-study-app -n exam-study  # Restart app
kubectl delete namespace exam-study  # Remove everything

# Helm (ArgoCD + Kubernetes Dashboard)
./scripts/setup-helm.sh          # Install ArgoCD, Image Updater, K8s Dashboard
./scripts/teardown-helm.sh       # Uninstall all Helm releases
helm list -A                     # List all Helm releases
kubectl port-forward svc/argocd-server -n argocd 8080:443 &  # ArgoCD UI
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &  # K8s Dashboard
kubectl get applications -n argocd  # Check ArgoCD sync status
```

## Git Branching Strategy

```
dev branch    → builds :dev image    → auto-deploys to localhost:30001
main branch   → builds :latest image → manual deploy to localhost:30000
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts 3, Zustand 5
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL 18 with JSONB for flexible question storage
- **Infrastructure**: Kubernetes (Docker Desktop), Helm, ArgoCD, Node.js 22 LTS

### Key Design Decisions
- Questions stored as JSONB in PostgreSQL for flexible schema
- SM-2 spaced repetition algorithm for review scheduling
- File-based question import via ZIP (markdown or JSON formats)
- PWA support for offline study

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── study/[examId]/     # Quiz, review, analytics pages
│   ├── admin/              # Exam management, import
│   └── api/                # REST endpoints
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── question/           # QuestionCard, OptionButton, ExplanationPanel
│   └── analytics/          # Charts and stats
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── srs.ts              # SM-2 algorithm implementation
│   └── parsers/            # Markdown and JSON question parsers
├── hooks/                  # useQuestions, useProgress, useKeyboard
├── stores/                 # Zustand stores (quizStore, settingsStore)
└── types/                  # TypeScript interfaces
```

### Data Models (Prisma)
- **Exam**: Container for questions with name/description
- **Question**: Number + JSONB data (text, options, correct answers, explanation, section, tags)
- **Answer**: Answer history with selected options, correctness, time spent
- **SrsCard**: SM-2 state (easeFactor, intervalDays, repetitions, nextReview)
- **Bookmark**: Flagged questions for later review
- **StudyProgress**: Snapshot for export/import

### API Endpoints
- `/api/exams` - CRUD for exams
- `/api/questions` - List/filter questions, get random
- `/api/import` - ZIP upload and processing
- `/api/progress/answer` - Submit answers
- `/api/srs/due` - Get cards due for review
- `/api/srs/grade` - Grade review (0-5 scale)
- `/api/analytics/*` - Accuracy trends, section breakdown, weak areas
- `/api/export/progress` - Export/import study progress

## Documentation

Comprehensive documentation is in `.claude/docs/`:
- `00-quick-reference.md` - Compact reference for common tasks
- `01-product-description.md` - Features, user goals, success metrics
- `02-technical-architecture.md` - Tech stack, data flows, design decisions
- `03-data-schema.md` - Prisma schema, JSONB structures, common queries
- `04-user-flows.md` - User journeys with wireframes, keyboard shortcuts
- `05-frontend-design.md` - Design system, component specs, responsive breakpoints
- `06-api-specification.md` - All endpoints with request/response examples
- `07-implementation-tasks.md` - Phased implementation checklist with doc references
- `08-deployment-guide.md` - Kubernetes setup, environment variables, troubleshooting
- `09-question-format.md` - Markdown question format specification for imports
- `10-infrastructure-access.md` - ArgoCD, Kubernetes, PostgreSQL access & credentials

## Implementation Notes

### SM-2 Algorithm
Located in `lib/srs.ts`. Grade scale: 0 (blackout) to 5 (perfect). Updates easeFactor and interval based on grade.

### Question Import
ZIP files containing `.md` or `.json` files. Parser extracts question text, options A-E, correct answers, explanation, "why wrong" explanations, section, tags, and confidence level. Images copied to `/public/images/`.

### Keyboard Shortcuts (Quiz Mode)
- `1-5` or `A-E`: Select option
- `Enter`: Submit answer
- `→` / `←`: Next/previous question
- `R`: Reveal answer
- `B`: Toggle bookmark

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: development/production
- `UPLOAD_MAX_SIZE`: Max ZIP size in bytes (default 50MB)
