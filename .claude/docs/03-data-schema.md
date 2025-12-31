# Data Schema

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐
│    Exam     │───────<    Question     │
├─────────────┤  1:N  ├─────────────────┤
│ id (PK)     │       │ id (PK)         │
│ name        │       │ examId (FK)     │
│ description │       │ number          │
│ createdAt   │       │ data (JSONB)    │
│ updatedAt   │       │ createdAt       │
└─────────────┘       │ updatedAt       │
      │               └─────────────────┘
      │                       │
      │ 1:N                   │ 1:N
      ▼                       ├─────────────────┐
┌─────────────────┐           │                 │
│ StudyProgress   │           │                 │
├─────────────────┤           ▼                 ▼
│ id (PK)         │    ┌───────────┐    ┌───────────┐
│ examId (FK)     │    │  Answer   │    │  SrsCard  │
│ name            │    ├───────────┤    ├───────────┤
│ data (JSONB)    │    │ id (PK)   │    │ id (PK)   │
│ createdAt       │    │ questionId│    │ questionId│
│ updatedAt       │    │ selected  │    │ easeFactor│
└─────────────────┘    │ correct   │    │ interval  │
                       │ timeSpent │    │ repetition│
                       │ answeredAt│    │ nextReview│
                       └───────────┘    │ lastReview│
                              │         │ lastGrade │
                              │         └───────────┘
                              │ 1:1
                              ▼
                       ┌───────────┐
                       │ Bookmark  │
                       ├───────────┤
                       │ id (PK)   │
                       │ questionId│
                       │ createdAt │
                       └───────────┘
```

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// EXAM
// ============================================
model Exam {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  questions   Question[]
  progress    StudyProgress[]
}

// ============================================
// QUESTION
// ============================================
model Question {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  number    Int
  data      Json     // Full question data as JSONB
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  answers   Answer[]
  srsCard   SrsCard?
  bookmarks Bookmark[]

  // Constraints
  @@unique([examId, number])
  @@index([examId])
}

// ============================================
// STUDY PROGRESS (Snapshot for export/import)
// ============================================
model StudyProgress {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  name      String   @default(dbgenerated("'Snapshot ' || to_char(now(), 'YYYY-MM-DD HH24:MI')"))
  data      Json     // Full progress snapshot
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([examId])
}

// ============================================
// ANSWER (History of answers)
// ============================================
model Answer {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  selected    String[] // Array of selected options ["A", "C"]
  correct     Boolean
  timeSpentMs Int?
  answeredAt  DateTime @default(now())

  @@index([questionId])
  @@index([answeredAt])
}

// ============================================
// SRS CARD (Spaced repetition state)
// ============================================
model SrsCard {
  id           String    @id @default(cuid())
  questionId   String    @unique
  question     Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  easeFactor   Float     @default(2.5)
  intervalDays Int       @default(0)
  repetitions  Int       @default(0)
  nextReview   DateTime  @default(now())
  lastReview   DateTime?
  lastGrade    Int?      // 0-5 scale

  @@index([nextReview])
}

// ============================================
// BOOKMARK
// ============================================
model Bookmark {
  id         String   @id @default(cuid())
  questionId String   @unique
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}

// ============================================
// SETTINGS (Key-value store)
// ============================================
model Settings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

## Question JSONB Structure

```typescript
// Types for the Question.data JSONB field

interface QuestionData {
  // Core content
  text: string;                        // Question text
  options: Record<string, string>;     // { "A": "Option text", "B": "..." }
  correct: string[];                   // ["A", "C"] for multi-select

  // Explanation
  explanation: string;                 // Why the answer is correct
  whyWrong?: Record<string, string>;   // { "B": "This is wrong because..." }

  // Metadata
  section?: string;                    // "2.3 - Establishing private connectivity"
  sectionId?: string;                  // "2.3"
  tags?: string[];                     // ["VPC", "Private Google Access"]
  confidence?: 'high' | 'medium' | 'low';

  // Media
  imageUrl?: string;                   // "/images/exam-id/question-167.jpg"

  // Source
  sourceUrl?: string;                  // Original source URL
}
```

**Example**:
```json
{
  "text": "Your company wants to restrict access to Cloud Storage buckets from only your on-premises network. Which solution should you implement?",
  "options": {
    "A": "Use VPC Service Controls with an access level for your on-premises IP range",
    "B": "Configure bucket IAM policies with IP conditions",
    "C": "Use Cloud NAT with the bucket in a private subnet",
    "D": "Configure Private Google Access on your VPC"
  },
  "correct": ["A"],
  "explanation": "VPC Service Controls create a security perimeter around Google Cloud resources. By defining an access level that allows only your on-premises IP range, you can restrict access to Cloud Storage buckets from only your corporate network.",
  "whyWrong": {
    "B": "Bucket IAM policies do not support IP-based conditions directly",
    "C": "Cloud NAT is for outbound access, not for restricting inbound access to buckets",
    "D": "Private Google Access allows VMs without external IPs to access Google APIs, but doesn't restrict access from on-premises"
  },
  "section": "2.3 - Establishing private connectivity",
  "sectionId": "2.3",
  "tags": ["VPC Service Controls", "Cloud Storage", "access control", "on-premises"],
  "confidence": "high",
  "sourceUrl": "https://example.com/question/123"
}
```

## StudyProgress JSONB Structure

```typescript
interface ProgressData {
  version: string;                     // Schema version
  exportedAt: string;                  // ISO timestamp
  examId: string;

  answers: {
    questionNumber: number;
    selected: string[];
    correct: boolean;
    timeSpentMs: number;
    answeredAt: string;
  }[];

  srsCards: {
    questionNumber: number;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReview: string;
    lastGrade: number;
  }[];

  bookmarks: {
    questionNumber: number;
    createdAt: string;
  }[];
}
```

## Database Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| Question | examId | B-tree | Filter by exam |
| Question | (examId, number) | Unique | Prevent duplicates |
| Answer | questionId | B-tree | Query answer history |
| Answer | answeredAt | B-tree | Time-based queries |
| SrsCard | nextReview | B-tree | Find due cards |
| SrsCard | questionId | Unique | One card per question |

## Migrations

### Initial Migration

```sql
-- CreateTable Exam
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable Question
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_examId_number_key" ON "Question"("examId", "number");
CREATE INDEX "Question_examId_idx" ON "Question"("examId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- (Similar for other tables...)
```

## Common Queries

### Get all questions for an exam
```typescript
const questions = await prisma.question.findMany({
  where: { examId },
  orderBy: { number: 'asc' }
});
```

### Get questions due for SRS review
```typescript
const dueCards = await prisma.srsCard.findMany({
  where: {
    question: { examId },
    nextReview: { lte: new Date() }
  },
  include: { question: true },
  orderBy: { nextReview: 'asc' },
  take: 20
});
```

### Get accuracy by section
```typescript
const accuracy = await prisma.$queryRaw`
  SELECT
    (q.data->>'sectionId') as section,
    COUNT(*) as total,
    SUM(CASE WHEN a.correct THEN 1 ELSE 0 END) as correct
  FROM "Answer" a
  JOIN "Question" q ON a."questionId" = q.id
  WHERE q."examId" = ${examId}
  GROUP BY (q.data->>'sectionId')
`;
```

### Get unanswered questions
```typescript
const unanswered = await prisma.question.findMany({
  where: {
    examId,
    answers: { none: {} }
  },
  orderBy: { number: 'asc' }
});
```
