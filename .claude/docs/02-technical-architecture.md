# Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Docker Compose                             │
├────────────────────────────────┬────────────────────────────────┤
│         Next.js 16             │          PostgreSQL 18          │
│       (Full-stack App)         │           (Database)            │
├────────────────────────────────┼────────────────────────────────┤
│ • React Server Components      │ • Exams table                   │
│ • API Routes (App Router)      │ • Questions table (JSONB)       │
│ • Server Actions               │ • Answers table                 │
│ • Prisma ORM                   │ • SRS Cards table               │
│ • Static file serving          │ • Bookmarks table               │
└────────────────────────────────┴────────────────────────────────┘
              ↑                              ↑
         Port 3000                      Port 5432
              │                              │
              └──────────── Docker Network ──┘
```

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework with SSR | 16.x |
| React | UI library | 19.x |
| TypeScript | Type safety | 5.x |
| Tailwind CSS | Utility-first styling | 4.x |
| shadcn/ui | Component library | latest |
| Recharts | Data visualization | 3.x |
| Zustand | Client-side state | 5.x |
| @serwist/next | PWA support | latest |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js API Routes | REST API endpoints | 16.x |
| Prisma | Database ORM | 7.x |
| adm-zip | ZIP file extraction | 0.5.x |
| react-dropzone | File upload handling | 14.x |

### Infrastructure
| Technology | Purpose | Version |
|------------|---------|---------|
| Docker | Containerization | 29.x |
| Docker Compose | Multi-container orchestration | 2.x |
| PostgreSQL | Relational database | 18 |
| Node.js | JavaScript runtime | 22 LTS |

## Project Structure

```
exam-study-app/
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # App container build
├── .env.example                # Environment template
├── package.json                # Dependencies
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   │
│   │   ├── study/              # Study pages
│   │   │   └── [examId]/
│   │   │       ├── page.tsx
│   │   │       ├── quiz/
│   │   │       ├── review/
│   │   │       └── analytics/
│   │   │
│   │   ├── admin/              # Admin pages
│   │   │   ├── page.tsx
│   │   │   ├── exams/
│   │   │   └── progress/
│   │   │
│   │   └── api/                # API routes
│   │       ├── exams/
│   │       ├── questions/
│   │       ├── import/
│   │       ├── progress/
│   │       ├── srs/
│   │       └── export/
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── question/           # Question-related
│   │   ├── admin/              # Admin-related
│   │   ├── analytics/          # Charts and stats
│   │   └── layout/             # Layout components
│   │
│   ├── lib/                    # Utilities
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── parsers/
│   │   │   ├── markdown.ts     # MD parser
│   │   │   └── json.ts         # JSON validator
│   │   ├── srs.ts              # SM-2 algorithm
│   │   ├── zip.ts              # ZIP handling
│   │   └── utils.ts            # General utilities
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useQuestions.ts
│   │   ├── useProgress.ts
│   │   └── useKeyboard.ts
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── quizStore.ts
│   │   └── settingsStore.ts
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
└── docs/                       # Documentation
```

## Data Flow

### Question Import Flow
```
User uploads ZIP
        │
        ▼
┌───────────────┐
│ API: /import  │
└───────────────┘
        │
        ▼
┌───────────────┐
│ Save to /tmp  │
└───────────────┘
        │
        ▼
┌───────────────┐
│ Extract ZIP   │──────┐
└───────────────┘      │
        │              │
        ▼              ▼
┌───────────────┐ ┌─────────────┐
│ Parse .md/.json│ │ Copy images │
└───────────────┘ └─────────────┘
        │              │
        ▼              ▼
┌───────────────┐ ┌─────────────┐
│ Bulk INSERT   │ │ /public/img │
└───────────────┘ └─────────────┘
        │
        ▼
┌───────────────┐
│ Cleanup /tmp  │
└───────────────┘
```

### Quiz Answer Flow
```
User selects answer
        │
        ▼
┌───────────────────┐
│ Client validation │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ POST /api/progress│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Insert Answer row │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Update SRS card   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Return feedback   │
└───────────────────┘
```

### SRS Review Flow
```
Load /study/[exam]/review
        │
        ▼
┌───────────────────────┐
│ GET /api/srs/due      │
│ WHERE nextReview < NOW│
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Display question      │
└───────────────────────┘
        │
        ▼
User grades (0-5)
        │
        ▼
┌───────────────────────┐
│ POST /api/srs/grade   │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Calculate SM-2        │
│ new interval & EF     │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Update SRS card       │
│ nextReview = NOW + N  │
└───────────────────────┘
```

## Key Design Decisions

### 1. Full-stack Next.js
**Rationale**: Single codebase, shared types, simpler deployment

### 2. PostgreSQL with JSONB
**Rationale**:
- Questions have varying structure (different number of options, optional fields)
- JSONB allows flexible storage while maintaining query performance
- Can still index specific JSONB fields if needed

### 3. File-based Import (ZIP)
**Rationale**:
- Works offline (no external API calls)
- Handles images naturally
- User controls the source data
- Easy to version control question files

### 4. Prisma ORM
**Rationale**:
- Type-safe database access
- Automatic migrations
- Great developer experience
- Works well with Next.js

### 5. Client-side State with Zustand
**Rationale**:
- Lightweight (< 1KB)
- Simple API
- Good for quiz state (current question, selected answers)
- Persists to localStorage for offline

## Security Considerations

- No authentication required (single-user)
- File uploads validated (ZIP only, size limits)
- SQL injection prevented by Prisma
- XSS prevented by React's default escaping
- CORS configured for same-origin only

## Performance Optimizations

1. **React Server Components** - Reduce client-side JavaScript
2. **Static Generation** - Pre-render where possible
3. **Database Indexes** - On examId, questionId, nextReview
4. **Image Optimization** - Next.js Image component
5. **PWA Caching** - Offline access to questions
