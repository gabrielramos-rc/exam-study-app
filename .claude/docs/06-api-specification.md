# API Specification

## Base URL

```
http://localhost:3000/api
```

## Authentication

No authentication required (single-user application).

---

## Endpoints

### Health Check

#### Get Health Status
```http
GET /api/health
```

**Response (Healthy - 200)**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "database": "connected"
}
```

**Response (Unhealthy - 503)**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "database": "disconnected",
  "error": "Connection refused"
}
```

---

### Exams

#### List Exams
```http
GET /api/exams
```

**Response**
```json
{
  "exams": [
    {
      "id": "clx1234567890",
      "name": "GCP Professional Cloud Security Engineer",
      "description": "Practice questions for the GCP Security certification",
      "questionCount": 346,
      "answeredCount": 120,
      "accuracy": 65.8,
      "dueForReview": 8,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Exam
```http
POST /api/exams
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "GCP Professional Cloud Security Engineer",
  "description": "Practice questions for the GCP Security certification"
}
```

**Response**
```json
{
  "id": "clx1234567890",
  "name": "GCP Professional Cloud Security Engineer",
  "description": "Practice questions for the GCP Security certification",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Get Exam
```http
GET /api/exams/{examId}
```

**Response**
```json
{
  "id": "clx1234567890",
  "name": "GCP Professional Cloud Security Engineer",
  "description": "...",
  "stats": {
    "totalQuestions": 346,
    "answered": 120,
    "correct": 78,
    "accuracy": 65.0,
    "dueForReview": 8,
    "bySection": [
      { "sectionId": "1.1", "section": "Managing Cloud Identity", "total": 25, "correct": 18, "accuracy": 72 }
    ]
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Delete Exam
```http
DELETE /api/exams/{examId}
```

**Response**
```json
{
  "success": true,
  "deleted": {
    "questions": 346,
    "answers": 1200,
    "srsCards": 346
  }
}
```

---

### Questions

#### List Questions
```http
GET /api/questions?examId={examId}&section={sectionId}&unanswered=true&limit=20&offset=0
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `examId` | string | Required. Filter by exam |
| `section` | string | Filter by section ID (e.g., "2.3") |
| `unanswered` | boolean | Only unanswered questions |
| `bookmarked` | boolean | Only bookmarked questions |
| `confidence` | string | Filter by confidence (high, medium, low) |
| `limit` | number | Max results (default: 20) |
| `offset` | number | Pagination offset |

**Response**
```json
{
  "questions": [
    {
      "id": "clx9876543210",
      "number": 42,
      "data": {
        "text": "Your company wants to...",
        "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correct": ["A"],
        "explanation": "...",
        "section": "2.3 - Establishing private connectivity",
        "sectionId": "2.3",
        "tags": ["VPC", "Service Controls"],
        "confidence": "high"
      },
      "isBookmarked": false,
      "lastAnswer": {
        "selected": ["B"],
        "correct": false,
        "answeredAt": "2024-01-14T15:30:00Z"
      }
    }
  ],
  "total": 346,
  "limit": 20,
  "offset": 0
}
```

#### Get Single Question
```http
GET /api/questions/{questionId}
```

**Response**
```json
{
  "id": "clx9876543210",
  "examId": "clx1234567890",
  "number": 42,
  "data": { ... },
  "isBookmarked": false,
  "answerHistory": [
    { "selected": ["B"], "correct": false, "answeredAt": "2024-01-14T15:30:00Z" },
    { "selected": ["A"], "correct": true, "answeredAt": "2024-01-15T10:00:00Z" }
  ],
  "srsCard": {
    "easeFactor": 2.5,
    "intervalDays": 4,
    "repetitions": 2,
    "nextReview": "2024-01-19T00:00:00Z"
  }
}
```

#### Get Random Question
```http
GET /api/questions/random?examId={examId}&section={sectionId}&unanswered=true
```

**Response**
Same as Get Single Question.

---

### Import

#### Import Questions from ZIP
```http
POST /api/import
Content-Type: multipart/form-data
```

**Request Body**
```
examId: clx1234567890
file: [ZIP file]
```

**Response**
```json
{
  "success": true,
  "imported": 346,
  "skipped": 3,
  "images": 2,
  "errors": [
    { "file": "question-050.md", "error": "Missing ## Answer section" }
  ]
}
```

#### Import Status (for long uploads)
```http
GET /api/import/status/{jobId}
```

**Response**
```json
{
  "status": "processing",
  "progress": {
    "current": 280,
    "total": 346,
    "phase": "parsing"
  }
}
```

---

### Progress

#### Submit Answer
```http
POST /api/progress/answer
Content-Type: application/json
```

**Request Body**
```json
{
  "questionId": "clx9876543210",
  "selected": ["A", "C"],
  "timeSpentMs": 45000
}
```

**Response**
```json
{
  "correct": true,
  "correctAnswer": ["A", "C"],
  "explanation": "VPC Service Controls create a security perimeter...",
  "whyWrong": null,
  "srsUpdate": {
    "previousInterval": 1,
    "newInterval": 6,
    "nextReview": "2024-01-21T00:00:00Z"
  }
}
```

#### Get Answer History
```http
GET /api/progress/history?examId={examId}&limit=50
```

**Response**
```json
{
  "answers": [
    {
      "questionId": "clx9876543210",
      "questionNumber": 42,
      "selected": ["A"],
      "correct": true,
      "timeSpentMs": 45000,
      "answeredAt": "2024-01-15T10:00:00Z"
    }
  ],
  "summary": {
    "total": 120,
    "correct": 78,
    "accuracy": 65.0,
    "avgTimeMs": 52000
  }
}
```

---

### Spaced Repetition

#### Get Due Cards
```http
GET /api/srs/due?examId={examId}&limit=20
```

**Response**
```json
{
  "cards": [
    {
      "questionId": "clx9876543210",
      "question": { ... },
      "easeFactor": 2.5,
      "intervalDays": 1,
      "repetitions": 0,
      "dueDate": "2024-01-15T00:00:00Z"
    }
  ],
  "totalDue": 8
}
```

#### Grade Review
```http
POST /api/srs/grade
Content-Type: application/json
```

**Request Body**
```json
{
  "questionId": "clx9876543210",
  "grade": 4,
  "timeSpentMs": 30000
}
```

**Grade Scale**
| Grade | Meaning |
|-------|---------|
| 0 | Complete blackout |
| 1 | Incorrect, remembered on seeing answer |
| 2 | Incorrect, easy recall after seeing answer |
| 3 | Correct with difficulty |
| 4 | Correct with hesitation |
| 5 | Perfect response |

**Response**
```json
{
  "success": true,
  "newInterval": 6,
  "newEaseFactor": 2.6,
  "nextReview": "2024-01-21T00:00:00Z",
  "remaining": 7
}
```

#### Get SRS Stats
```http
GET /api/srs/stats?examId={examId}
```

**Response**
```json
{
  "totalCards": 346,
  "dueToday": 8,
  "dueTomorrow": 12,
  "dueThisWeek": 45,
  "averageEaseFactor": 2.4,
  "distribution": {
    "new": 226,
    "learning": 45,
    "review": 75
  }
}
```

---

### Bookmarks

#### Toggle Bookmark
```http
POST /api/bookmarks/toggle
Content-Type: application/json
```

**Request Body**
```json
{
  "questionId": "clx9876543210"
}
```

**Response**
```json
{
  "bookmarked": true
}
```

#### List Bookmarks
```http
GET /api/bookmarks?examId={examId}
```

**Response**
```json
{
  "bookmarks": [
    {
      "questionId": "clx9876543210",
      "questionNumber": 42,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Analytics

#### Get Accuracy Trend
```http
GET /api/analytics/accuracy?examId={examId}&days=30
```

**Response**
```json
{
  "trend": [
    { "date": "2024-01-01", "accuracy": 55, "answered": 10 },
    { "date": "2024-01-02", "accuracy": 60, "answered": 15 },
    { "date": "2024-01-03", "accuracy": 58, "answered": 20 }
  ],
  "overall": {
    "accuracy": 65,
    "totalAnswered": 120
  }
}
```

#### Get Section Breakdown
```http
GET /api/analytics/sections?examId={examId}
```

**Response**
```json
{
  "sections": [
    {
      "sectionId": "1.1",
      "section": "Managing Cloud Identity",
      "total": 25,
      "answered": 20,
      "correct": 15,
      "accuracy": 75
    },
    {
      "sectionId": "2.3",
      "section": "Establishing private connectivity",
      "total": 30,
      "answered": 25,
      "correct": 10,
      "accuracy": 40
    }
  ]
}
```

#### Get Weak Areas
```http
GET /api/analytics/weak-areas?examId={examId}&threshold=60
```

**Response**
```json
{
  "weakAreas": [
    {
      "sectionId": "2.3",
      "section": "Establishing private connectivity",
      "accuracy": 40,
      "questionsToReview": 15
    },
    {
      "sectionId": "3.2",
      "section": "Managing encryption",
      "accuracy": 55,
      "questionsToReview": 8
    }
  ]
}
```

---

### Export/Import Progress

#### Export Progress
```http
GET /api/export/progress?examId={examId}
```

**Response** (downloadable JSON file)
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:00:00Z",
  "examId": "clx1234567890",
  "examName": "GCP Professional Cloud Security Engineer",
  "answers": [ ... ],
  "srsCards": [ ... ],
  "bookmarks": [ ... ]
}
```

#### Import Progress
```http
POST /api/import/progress
Content-Type: application/json
```

**Request Body**
```json
{
  "examId": "clx1234567890",
  "data": { ... }
}
```

**Response**
```json
{
  "success": true,
  "imported": {
    "answers": 250,
    "srsCards": 346,
    "bookmarks": 12
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Exam not found",
    "details": { "examId": "clx1234567890" }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `IMPORT_ERROR` | 422 | Failed to parse import file |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

No rate limiting (single-user application).

## File Size Limits

- ZIP upload: 50 MB max
- Progress import: 10 MB max
