# Product Description

## Overview

**Exam Study App** is a self-hosted web application designed for studying certification exam questions with spaced repetition and analytics.

## Target Users

- **IT Professionals** preparing for cloud certifications (GCP, AWS, Azure)
- **Students** studying for technical exams
- **Self-learners** who want structured exam preparation

## Problem Statement

Studying for certification exams often involves:
- Unstructured review of practice questions
- No visibility into weak areas
- Forgetting material over time
- Scattered progress across multiple tools

## Solution

A unified study platform that:
1. **Organizes questions by exam** - Support multiple certifications
2. **Tracks progress** - Know exactly where you stand
3. **Uses spaced repetition** - Optimize memory retention with SM-2 algorithm
4. **Provides analytics** - Identify weak areas and track improvement
5. **Works offline** - Study anywhere with PWA support

## Key Features

### Multi-Exam Support
- Create exams for different certifications
- Import questions via ZIP file upload
- Supports markdown and JSON question formats
- Handles images and diagrams

### Study Modes
| Mode | Purpose |
|------|---------|
| **Quiz** | Practice questions with immediate feedback |
| **Review** | Spaced repetition based on SM-2 algorithm |
| **Practice Exam** | Timed simulation of real exam conditions |

### Progress Tracking
- Answer history for every question
- Accuracy metrics overall and per section
- Time spent tracking
- Bookmarks for flagged questions

### Analytics Dashboard
- Accuracy trends over time
- Performance breakdown by exam section
- Weak area identification
- Study session statistics

### Admin Features
- Create and manage exams
- Import questions via drag-and-drop
- Export/import study progress
- Reset progress per exam

## Non-Goals (Out of Scope)

- Multi-user authentication (single-user app)
- Question creation/editing in the app
- Integration with external platforms
- Mobile native apps (web only, responsive)

## Success Metrics

- User can import 300+ questions in under 30 seconds
- Quiz mode responds in under 100ms
- SRS algorithm correctly schedules reviews
- Offline mode works for all study features

## Technical Constraints

- Must run in Kubernetes (Docker Desktop)
- Single-user deployment
- File-based question import (no API integrations)
- PostgreSQL for persistent storage
- Serves as CKAD/CKS learning platform

## Infrastructure Features

- **Multi-environment**: Dev (auto-deploy) and Prod (manual approval)
- **GitOps**: ArgoCD for declarative, Git-based deployments
- **CI/CD**: GitHub Actions for build, test, security scanning
- **Container Registry**: GitHub Container Registry (GHCR)
- **Configuration Management**: Kustomize overlays for environment differences
