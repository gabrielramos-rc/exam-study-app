# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Study App is a self-hosted Next.js 16 web application for studying certification exam questions with spaced repetition (SM-2 algorithm) and analytics. It's a single-user app designed to run in Docker with PostgreSQL.

## Commands

```bash
# Development
npm install                      # Install dependencies
docker compose up -d db          # Start PostgreSQL only
npx prisma migrate dev           # Run migrations (dev)
npm run dev                      # Start dev server at localhost:3000

# Production
docker compose up --build        # Build and start all services
docker compose up -d             # Start detached

# Database
npx prisma migrate deploy        # Run migrations (prod)
npx prisma studio                # Visual database editor at localhost:5555
docker compose exec db psql -U study -d study  # Database shell

# Docker Management
docker compose logs -f app       # View app logs
docker compose exec app npx prisma migrate deploy  # Run migrations in container
docker compose down              # Stop services
docker compose down -v           # Stop and delete all data
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts 3, Zustand 5
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL 18 with JSONB for flexible question storage
- **Infrastructure**: Docker Compose (app + db containers), Node.js 22 LTS

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
- `01-product-description.md` - Features, user goals, success metrics
- `02-technical-architecture.md` - Tech stack, data flows, design decisions
- `03-data-schema.md` - Prisma schema, JSONB structures, common queries
- `04-user-flows.md` - User journeys with wireframes, keyboard shortcuts
- `05-frontend-design.md` - Design system, component specs, responsive breakpoints
- `06-api-specification.md` - All endpoints with request/response examples
- `07-implementation-tasks.md` - Phased implementation checklist with doc references
- `08-deployment-guide.md` - Docker setup, environment variables, troubleshooting

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
