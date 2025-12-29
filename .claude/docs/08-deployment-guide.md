# Deployment Guide

## Prerequisites

- Docker Engine 29.x or later
- Docker Compose 2.x or later
- 2GB RAM minimum
- 10GB disk space

---

## Quick Start

```bash
# Clone/copy the project
cd exam-study-app

# Start everything
docker compose up --build

# Open browser
open http://localhost:3000
```

---

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://study:study@db:5432/study
      - NODE_ENV=production
    volumes:
      - uploads:/app/uploads
      - images:/app/public/images
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

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
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  uploads:
  images:
```

### Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create directories for volumes
RUN mkdir -p /app/uploads /app/public/images

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

### docker-entrypoint.sh

```bash
#!/bin/sh
set -e

# Wait for database
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the app
echo "Starting application..."
exec "$@"
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | App port | `3000` |
| `UPLOAD_MAX_SIZE` | Max ZIP upload size (bytes) | `52428800` (50MB) |

### .env.example

```bash
# Database
DATABASE_URL=postgresql://study:study@localhost:5432/study

# App
NODE_ENV=development
PORT=3000
UPLOAD_MAX_SIZE=52428800
```

---

## Development Setup

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL (Docker)
docker compose up -d db

# Create .env file
cp .env.example .env
# Edit DATABASE_URL if needed

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Development with Docker

```bash
# Build and start all services
docker compose up --build

# Watch logs
docker compose logs -f app

# Restart after code changes
docker compose restart app
```

---

## Production Deployment

### Build for Production

```bash
# Build Docker image
docker build -t exam-study-app .

# Or with compose
docker compose build
```

### Start Production

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Stop Services

```bash
# Stop all
docker compose down

# Stop and remove volumes (DELETES DATA!)
docker compose down -v
```

---

## Database Management

### Run Migrations

```bash
# In development
npx prisma migrate dev

# In production
npx prisma migrate deploy

# Via Docker
docker compose exec app npx prisma migrate deploy
```

### Reset Database

```bash
# Development only - DELETES ALL DATA
npx prisma migrate reset

# Via Docker
docker compose exec app npx prisma migrate reset --force
```

### Database Shell

```bash
# Connect to PostgreSQL
docker compose exec db psql -U study -d study

# Common queries
\dt                    # List tables
\d "Question"          # Describe table
SELECT COUNT(*) FROM "Question";
```

### Prisma Studio (Visual Editor)

```bash
# Start Prisma Studio
npx prisma studio

# Opens at http://localhost:5555
```

---

## Backup & Restore

### Backup Database

```bash
# Create backup
docker compose exec db pg_dump -U study study > backup.sql

# With timestamp
docker compose exec db pg_dump -U study study > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
docker compose exec -T db psql -U study study < backup.sql
```

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm \
  -v exam-study-app_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar cvf /backup/postgres-data.tar /data

# Backup images
docker run --rm \
  -v exam-study-app_images:/data \
  -v $(pwd)/backups:/backup \
  alpine tar cvf /backup/images.tar /data
```

---

## Troubleshooting

### App Won't Start

```bash
# Check logs
docker compose logs app

# Common issues:
# 1. Database not ready - wait or restart
# 2. Migration failed - check DATABASE_URL
# 3. Port in use - change port mapping
```

### Database Connection Failed

```bash
# Check database is running
docker compose ps db

# Check database logs
docker compose logs db

# Test connection
docker compose exec db pg_isready -U study
```

### Import Failed

```bash
# Check upload directory permissions
docker compose exec app ls -la /app/uploads

# Check disk space
docker compose exec app df -h

# Check logs for specific error
docker compose logs app | grep -i error
```

### Reset Everything

```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker rmi exam-study-app

# Rebuild from scratch
docker compose up --build
```

---

## Monitoring

### View Logs

```bash
# All logs
docker compose logs -f

# App only
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### Check Resources

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Health Check

```bash
# Check app health
curl http://localhost:3000/api/health

# Check database
docker compose exec db pg_isready -U study
```

---

## Updates

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up --build -d

# Run new migrations
docker compose exec app npx prisma migrate deploy
```

### Update Dependencies

```bash
# Update npm packages
npm update

# Rebuild Docker image
docker compose build --no-cache app

# Restart
docker compose up -d
```

---

## Security Notes

1. **Change default passwords** in production
2. **Don't expose database** port externally
3. **Use HTTPS** with a reverse proxy (nginx, traefik)
4. **Regular backups** of database
5. **Keep Docker updated** for security patches

### Example nginx proxy

```nginx
server {
    listen 443 ssl;
    server_name study.example.com;

    ssl_certificate /etc/ssl/certs/study.crt;
    ssl_certificate_key /etc/ssl/private/study.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
