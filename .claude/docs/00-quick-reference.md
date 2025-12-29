# Quick Reference

Compact reference for implementation. See full docs only for edge cases.

**Related Docs:**
- `09-question-format.md` - Markdown format for importing questions
- `10-infrastructure-access.md` - Full access guide for ArgoCD, Kubernetes, PostgreSQL

---

## Project Structure

```
exam-study-app/
├── .github/workflows/              # CI/CD pipelines
├── k8s/
│   ├── base/                       # Kustomize base
│   ├── overlays/dev/               # Dev environment
│   ├── overlays/prod/              # Prod environment
│   └── argocd/                     # ArgoCD apps
├── scripts/                        # Setup scripts
├── src/
│   ├── app/
│   │   ├── page.tsx                # Home/dashboard
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   ├── study/[examId]/
│   │   │   ├── page.tsx            # Exam dashboard
│   │   │   ├── quiz/page.tsx       # Quiz mode
│   │   │   ├── review/page.tsx     # SRS review mode
│   │   │   └── analytics/page.tsx  # Analytics
│   │   ├── admin/
│   │   │   ├── page.tsx            # Admin home
│   │   │   ├── exams/page.tsx      # Exam list
│   │   │   ├── exams/new/page.tsx  # Create exam
│   │   │   ├── exams/[id]/page.tsx # Exam detail
│   │   │   ├── exams/[id]/import/  # Import questions
│   │   │   └── progress/page.tsx   # Export/import progress
│   │   └── api/                    # See API section below
│   ├── components/
│   │   ├── ui/                     # shadcn/ui
│   │   ├── layout/                 # Sidebar, Header
│   │   ├── question/               # QuestionCard, OptionButton, ExplanationPanel
│   │   └── analytics/              # Charts
│   ├── lib/
│   │   ├── prisma.ts               # Prisma singleton
│   │   ├── srs.ts                  # SM-2 algorithm
│   │   ├── utils.ts                # cn() helper
│   │   └── parsers/
│   │       ├── markdown.ts         # MD question parser
│   │       └── json.ts             # JSON validator
│   ├── hooks/
│   ├── stores/
│   └── types/
└── Dockerfile
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Exam {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  questions   Question[]
  progress    StudyProgress[]
}

model Question {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  number    Int
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  answers   Answer[]
  srsCard   SrsCard?
  bookmarks Bookmark[]
  @@unique([examId, number])
  @@index([examId])
}

model Answer {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  selected    String[]
  correct     Boolean
  timeSpentMs Int?
  answeredAt  DateTime @default(now())
  @@index([questionId])
  @@index([answeredAt])
}

model SrsCard {
  id           String    @id @default(cuid())
  questionId   String    @unique
  question     Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  easeFactor   Float     @default(2.5)
  intervalDays Int       @default(0)
  repetitions  Int       @default(0)
  nextReview   DateTime  @default(now())
  lastReview   DateTime?
  lastGrade    Int?
  @@index([nextReview])
}

model Bookmark {
  id         String   @id @default(cuid())
  questionId String   @unique
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}

model StudyProgress {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  name      String   @default("Default")
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([examId])
}

model Settings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## Question.data JSONB

```typescript
interface QuestionData {
  text: string;
  options: Record<string, string>;  // { "A": "...", "B": "..." }
  correct: string[];                // ["A"] or ["A", "C"]
  explanation: string;
  whyWrong?: Record<string, string>;
  section: string;                  // "2.3 - Section Name"
  sectionId: string;                // "2.3"
  tags?: string[];
  confidence: "high" | "medium" | "low";
  imageUrl?: string;
  sourceUrl?: string;
}
```

---

## API Endpoints

### Exams
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/exams` | List all exams |
| POST | `/api/exams` | Create exam `{name, description?}` |
| GET | `/api/exams/[id]` | Get exam with stats |
| DELETE | `/api/exams/[id]` | Delete exam + cascade |

### Questions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/questions?examId&section?&unanswered?&bookmarked?&limit?&offset?` | List/filter |
| GET | `/api/questions/[id]` | Single question + history |
| GET | `/api/questions/random?examId&filters...` | Random question |

### Import
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/import` | Upload ZIP `multipart: {examId, file}` |

### Progress
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/progress/answer` | Submit `{questionId, selected[], timeSpentMs?}` |
| GET | `/api/progress/history?examId` | Answer history |

### SRS
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/srs/due?examId&limit?` | Cards due for review |
| POST | `/api/srs/grade` | Grade review `{questionId, grade: 0-5}` |
| GET | `/api/srs/stats?examId` | SRS statistics |

### Bookmarks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/bookmarks/toggle` | Toggle `{questionId}` |
| GET | `/api/bookmarks?examId` | List bookmarks |

### Analytics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics/accuracy?examId&days?` | Accuracy trend |
| GET | `/api/analytics/sections?examId` | By section |
| GET | `/api/analytics/weak-areas?examId&threshold?` | Weak areas |

### Export/Import Progress
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/export/progress?examId` | Download JSON |
| POST | `/api/import/progress` | Upload `{examId, data}` |

---

## Key Components

```typescript
// QuestionCard
interface QuestionCardProps {
  question: Question;
  mode: "quiz" | "review" | "view";
  selectedOptions: string[];
  onSelect: (option: string) => void;
  showAnswer: boolean;
  onSubmit?: () => void;
}

// OptionButton
interface OptionButtonProps {
  label: string;        // "A", "B"
  text: string;
  selected: boolean;
  correct?: boolean;    // Only when revealed
  showResult: boolean;
  onClick: () => void;
  disabled: boolean;
}

// ExplanationPanel
interface ExplanationPanelProps {
  correct: string[];
  explanation: string;
  whyWrong?: Record<string, string>;
  references?: string[];
}
```

---

## SM-2 Algorithm

```typescript
function calculateSM2(
  grade: number,        // 0-5
  repetitions: number,
  easeFactor: number,
  interval: number
): { repetitions: number; easeFactor: number; interval: number }

// Grade scale:
// 0 = blackout, 1 = wrong but recognized, 2 = wrong but easy recall
// 3 = correct difficult, 4 = correct hesitation, 5 = perfect

// UI buttons map: Again=0, Hard=2, Good=4, Easy=5
```

---

## Keyboard Shortcuts

| Key | Quiz Mode | Review Mode |
|-----|-----------|-------------|
| 1-5 / A-E | Select option | - |
| Enter | Submit | - |
| → / Space | Next | Next |
| ← | Previous | - |
| R | Reveal answer | - |
| B | Toggle bookmark | - |
| 1-4 | - | Grade (Again/Hard/Good/Easy) |

---

## Kubernetes

```bash
# Quick start (single environment)
docker build -t exam-study-app:latest .
kubectl apply -f k8s/base/
kubectl get pods -n exam-study -w
open http://localhost:30000

# Common commands
kubectl get all -n exam-study              # View resources
kubectl logs -f deploy/exam-study-app -n exam-study  # App logs
kubectl exec -it deploy/postgres -n exam-study -- psql -U study -d study  # DB shell
kubectl rollout restart deploy/exam-study-app -n exam-study  # Restart app
kubectl delete namespace exam-study        # Reset everything
```

```yaml
# Key manifests in k8s/base/
- namespace.yaml     # exam-study namespace
- configmap.yaml     # App configuration
- secret.yaml        # Database credentials
- postgres/          # PostgreSQL Deployment + Service + PVC
- app/               # App Deployment + Service
- jobs/              # Migration Job
```

---

## Multi-Environment (Kustomize + ArgoCD)

### Environments
| Environment | Branch | Port | Sync |
|-------------|--------|------|------|
| Dev | `dev` | 30001 | Auto |
| Prod | `main` | 30000 | Manual |

### Kustomize
```bash
# Preview environment
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/prod

# Apply directly (without ArgoCD)
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/prod
```

### Helm (ArgoCD + Dashboard)
```bash
# Setup (installs ArgoCD, Image Updater, K8s Dashboard)
./scripts/setup-helm.sh

# Access UIs
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443 &
open https://localhost:8080     # ArgoCD
open https://localhost:8443     # K8s Dashboard

# Helm management
helm list -A                    # List releases
helm upgrade argocd argo/argo-cd -n argocd  # Upgrade

# Check status
kubectl get applications -n argocd

# Force sync
kubectl patch application exam-study-app-dev -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Teardown
./scripts/teardown-helm.sh
```

### Git Workflow
```bash
# Dev: auto-deploys on push
git checkout dev
git push origin dev  # → builds :dev → ArgoCD auto-syncs

# Prod: manual approval required
git checkout main
git merge dev
git push origin main
gh release create v1.0.0  # → builds :latest
# Then manually sync in ArgoCD
```

---

## Environment Variables

```bash
DATABASE_URL=postgresql://study:study@localhost:5432/study
NODE_ENV=development
UPLOAD_MAX_SIZE=52428800  # 50MB
```

---

## shadcn/ui Components Used

Button, Card, Badge, Progress, Dialog, DropdownMenu, Tabs, Input, Textarea, Select, Checkbox, RadioGroup, Toast, Skeleton

---

## Phase Dependencies

```
Phase 1 (Foundation) → Phase 2 (Admin/Import) → Phase 3 (Study) → Phase 4 (SRS)
                                                      ↓                  ↓
                                                Phase 5 (Analytics) → Phase 6 (Polish/PWA)
                                                                         ↓
                                                                   Phase 7 (K8s/CKAD/CKS)
```
