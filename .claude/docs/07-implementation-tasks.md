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
- [ ] Initialize shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Configure dark theme as default
- [ ] Install core components: Button, Card, Badge, Input, Dialog
- [ ] Set up global CSS variables

### 1.3 Database Setup
**Read:** `03-data-schema.md` (full document)
- [ ] Install Prisma
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] Create `schema.prisma` with all models (copy from `03-data-schema.md`)
- [ ] Set up Prisma client singleton (`lib/prisma.ts`)
- [ ] Create initial migration

### 1.4 Docker Setup
**Read:** `08-deployment-guide.md` (Docker Configuration section)
- [ ] Create `Dockerfile` for Next.js app
- [ ] Create `docker-compose.yml` with app + PostgreSQL
- [ ] Create `docker-entrypoint.sh` for migrations
- [ ] Test local Docker build

### 1.5 Basic Layout
**Read:** `05-frontend-design.md` (Page Layouts section)
- [ ] Create root layout with providers
- [ ] Create sidebar navigation component
- [ ] Create header component with theme toggle
- [ ] Set up next-themes for dark/light mode

**Deliverables:**
- Working Next.js app with Tailwind + shadcn/ui
- PostgreSQL running in Docker
- Basic layout with navigation
- Database migrations working

---

## Phase 2: Admin & Import

### Required Reading
Before starting this phase, read:
- `04-user-flows.md` - Flow 1 (First-Time Setup), Flow 5 (Import Questions)
- `06-api-specification.md` - Exams endpoints, Import endpoints
- `03-data-schema.md` - Exam model, Question model, JSONB structure

### 2.1 Exam Management
**Read:** `06-api-specification.md` (Exams section)
- [ ] Create exam list page (`/admin/exams`)
- [ ] Create exam form component
- [ ] Create new exam page (`/admin/exams/new`)
- [ ] Implement `POST /api/exams` endpoint
- [ ] Implement `GET /api/exams` endpoint
- [ ] Implement `DELETE /api/exams/{id}` endpoint
- [ ] Create exam detail page (`/admin/exams/[id]`)

### 2.2 ZIP Upload
**Read:** `04-user-flows.md` (Flow 5 - Import Questions)
- [ ] Install react-dropzone
- [ ] Create ImportDropzone component (see `05-frontend-design.md`)
- [ ] Create upload progress indicator
- [ ] Implement file validation (ZIP only, size limit)

### 2.3 Question Parsing
**Read:** `03-data-schema.md` (Question JSONB Structure section)
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

### 6.4 Error Handling
**Read:** `05-frontend-design.md` (Error States section)
**Read:** `06-api-specification.md` (Error Responses section)
- [ ] Global error boundary
- [ ] Toast notifications for actions
- [ ] Form validation messages
- [ ] API error handling
- [ ] Loading states everywhere

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

**Deliverables:**
- PWA working with offline support
- Mobile-responsive design
- Polished error handling
- Optimized performance

---

## Quick Reference: Docs by Topic

| Topic | Primary Doc | Supporting Docs |
|-------|-------------|-----------------|
| **Project structure** | `02-technical-architecture.md` | - |
| **Database models** | `03-data-schema.md` | - |
| **User journeys** | `04-user-flows.md` | `01-product-description.md` |
| **UI components** | `05-frontend-design.md` | `04-user-flows.md` |
| **API endpoints** | `06-api-specification.md` | `03-data-schema.md` |
| **Docker/Deploy** | `08-deployment-guide.md` | `02-technical-architecture.md` |

---

## Task Checklist Summary

| Phase | Tasks | Priority | Key Docs to Read |
|-------|-------|----------|------------------|
| 1. Foundation | 18 | Critical | 02, 03, 05, 08 |
| 2. Admin & Import | 20 | Critical | 03, 04, 06 |
| 3. Study Features | 22 | Critical | 04, 05, 06 |
| 4. Spaced Repetition | 15 | High | 03, 04, 06 |
| 5. Analytics | 14 | Medium | 03, 04, 05, 06 |
| 6. Polish & PWA | 20 | Medium | 01, 05, 08 |

**Total: ~109 tasks**

---

## Dependencies Between Phases

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4
   │                        │
   │                        ▼
   └──────────────────► Phase 5
                            │
                            ▼
                        Phase 6
```

- Phase 2 requires Phase 1 (database, layout)
- Phase 3 requires Phase 2 (questions in database)
- Phase 4 requires Phase 3 (answer tracking)
- Phase 5 requires Phase 3 (answer data for analytics)
- Phase 6 can start after Phase 3 is stable

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
| Docker config | `08-deployment-guide.md` | Docker Configuration |
| Handle errors | `06-api-specification.md` | Error Responses |
