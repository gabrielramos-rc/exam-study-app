# Exam Study App

A self-hosted Next.js web application for studying certification exam questions with spaced repetition (SM-2 algorithm) and analytics.

## Features

- **Question Import**: Upload ZIP files containing markdown or JSON formatted questions
- **Spaced Repetition**: SM-2 algorithm for optimal review scheduling
- **Quiz Mode**: Practice with immediate feedback and explanations
- **Review Mode**: Focus on questions due for review
- **Analytics**: Track progress, accuracy trends, and identify weak areas
- **Bookmarks**: Flag questions for later review
- **Keyboard Navigation**: Full keyboard support for efficient studying
- **PWA Support**: Offline study capability

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with JSONB for flexible question storage
- **Infrastructure**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 24 LTS
- Docker and Docker Compose
- npm

### Development

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d db

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production

```bash
# Build and start all services
docker compose up --build -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment mode | `development` |
| `UPLOAD_MAX_SIZE` | Max ZIP upload size in bytes | `52428800` (50MB) |

## License

Private - All rights reserved.
