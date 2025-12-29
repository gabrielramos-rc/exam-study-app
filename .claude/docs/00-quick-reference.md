# Quick Reference

Compact reference for implementation. See full docs only for edge cases.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home/dashboard
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── study/[examId]/
│   │   ├── page.tsx                # Exam dashboard
│   │   ├── quiz/page.tsx           # Quiz mode
│   │   ├── review/page.tsx         # SRS review mode
│   │   └── analytics/page.tsx      # Analytics
│   ├── admin/
│   │   ├── page.tsx                # Admin home
│   │   ├── exams/page.tsx          # Exam list
│   │   ├── exams/new/page.tsx      # Create exam
│   │   ├── exams/[id]/page.tsx     # Exam detail
│   │   ├── exams/[id]/import/page.tsx  # Import questions
│   │   └── progress/page.tsx       # Export/import progress
│   └── api/                        # See API section below
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── layout/                     # Sidebar, Header
│   ├── question/                   # QuestionCard, OptionButton, ExplanationPanel
│   └── analytics/                  # Charts
├── lib/
│   ├── prisma.ts                   # Prisma singleton
│   ├── srs.ts                      # SM-2 algorithm
│   ├── utils.ts                    # cn() helper
│   └── parsers/
│       ├── markdown.ts             # MD question parser
│       └── json.ts                 # JSON validator
├── hooks/
│   ├── useQuestions.ts
│   ├── useProgress.ts
│   └── useKeyboard.ts
├── stores/
│   ├── quizStore.ts                # Zustand
│   └── settingsStore.ts
└── types/
    └── index.ts
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

## Docker

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://study:study@db:5432/study
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:18-alpine
    environment:
      - POSTGRES_USER=study
      - POSTGRES_PASSWORD=study
      - POSTGRES_DB=study
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U study"]
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
                                                      ↓
                                                Phase 5 (Analytics) → Phase 6 (Polish/PWA)
```
