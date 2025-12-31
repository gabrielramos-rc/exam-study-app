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
}

// Note: DATABASE_URL is configured in prisma.config.ts (Prisma 7+)

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

### Health Check

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Kubernetes liveness/readiness probe |

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

## Docker Commands

```bash
# Build dev image
docker build -t ghcr.io/gabrielramos-rc/exam-study-app:dev .

# Build prod image
docker build -t ghcr.io/gabrielramos-rc/exam-study-app:latest .

# Run locally (for testing)
docker run -p 3000:3000 -e DATABASE_URL="..." ghcr.io/gabrielramos-rc/exam-study-app:dev
```

---

## Kubernetes

```bash
# Quick start
./scripts/setup-helm-essentials.sh       # Install Helm charts (includes PostgreSQL)
docker build -t ghcr.io/gabrielramos-rc/exam-study-app:dev .
kubectl apply -k k8s/overlays/dev/
kubectl get pods -n exam-study-dev -w
open http://localhost:30001               # Dev
open http://localhost:30000               # Prod

# Common commands
kubectl get all -n exam-study-dev                               # View resources
kubectl logs -f deploy/exam-study-app -n exam-study-dev         # App logs
kubectl exec -it deploy/postgres-postgresql -n exam-study-dev -- psql -U study -d study  # DB shell
kubectl rollout restart deploy/exam-study-app -n exam-study-dev # Restart app
./scripts/teardown-helm-essentials.sh                           # Remove Helm charts
```

```yaml
# Key manifests
k8s/base/              # Kustomize base
k8s/overlays/dev/      # Dev environment (port 30001)
k8s/overlays/prod/     # Prod environment (port 30000)

# PostgreSQL (via Helm - managed by setup-helm-essentials.sh)
postgres-credentials   # Secret with random password (auto-generated)
```

### PostgreSQL (Helm)

```bash
# Setup (included in setup-helm-essentials.sh)
helm install postgres bitnami/postgresql -n exam-study-dev \
  --set auth.username=study --set auth.database=study

# Port-forward (automated via start.sh)
kubectl port-forward svc/postgres-postgresql -n exam-study-dev 5432:5432 &
kubectl port-forward svc/postgres-postgresql -n exam-study-prod 5433:5432 &

# Get password
kubectl get secret postgres-credentials -n exam-study-dev \
  -o jsonpath='{.data.postgres-password}' | base64 -d

# Database shell
kubectl exec -it postgres-postgresql-0 -n exam-study-dev -- psql -U study -d study

# Verify connection
kubectl exec postgres-postgresql-0 -n exam-study-dev -- pg_isready -U study
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

## Prisma Commands

```bash
npx prisma generate          # Regenerate client after schema changes
npx prisma migrate dev       # Create and apply migration (dev)
npx prisma migrate deploy    # Apply migrations (prod)
npx prisma studio            # Visual database editor at localhost:5555
npx prisma db push           # Push schema without migrations (prototyping)
npx prisma format            # Format schema file
```

---

## Environment Variables

```bash
# Get DATABASE_URL from Kubernetes secret
kubectl get secret postgres-credentials -n exam-study-dev \
  -o jsonpath='{.data.database-url}' | base64 -d

# Or for local development (password from secret)
DATABASE_URL=postgresql://study:<password>@localhost:5432/study
NODE_ENV=development
UPLOAD_MAX_SIZE=52428800  # 50MB
```

---

## Layout Components

| Component | Purpose |
|-----------|---------|
| `MainLayout` | Main app layout with header, sidebar, mobile nav |
| `Header` | Sticky header with app logo and theme toggle |
| `Sidebar` | Desktop navigation (visible on md+) |
| `MobileNav` | Bottom navigation for mobile |
| `ThemeToggle` | Dark/light mode toggle button |
| `Providers` | App-wide providers wrapper (theme) |

---

## shadcn/ui Components Used

Button, Card, Badge, Progress, Dialog, AlertDialog, DropdownMenu, Tabs, Input, Textarea, Select, Checkbox, RadioGroup, Toast, Skeleton

---

## Form Validation Libraries

```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
// Usage pattern
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(1000).optional(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

---

## Phase Dependencies

```
Phase 1 (Foundation) → Phase 2 (Admin/Import) → Phase 3 (Study) → Phase 4 (SRS)
                                                      ↓                  ↓
                                                Phase 5 (Analytics) → Phase 6 (Polish/PWA)
                                                                         ↓
                                                                   Phase 7 (K8s/CKAD/CKS)
```
