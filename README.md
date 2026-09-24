# Vetalert — Livestock Health Surveillance System

Problem Statement ID **26128** — Government of Maharashtra

An end-to-end animal health surveillance and decision-support system enabling early detection, prevention, and management of livestock diseases, with support for low-connectivity rural areas.

## Tech Stack

| Layer      | Technology                                                          |
| ---------- | ------------------------------------------------------------------- |
| Frontend   | React + TypeScript, Vite, MUI, Tailwind CSS, Leaflet, Recharts, i18next, PWA |
| Backend    | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2                         |
| Database   | PostgreSQL 16 + PostGIS                                              |
| Async      | Celery + Redis                                                        |
| ML         | Scikit-learn (rule-based triage + risk scoring), OpenCV (image analysis) |
| Deploy     | Docker Compose → AWS/Azure/GCP                                        |
| Channels   | Web, Mobile (PWA), SMS/IVR (via notification service)                 |

## Architecture

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Farmer     │──▶│  Mobile/Web  │──▶│  FastAPI     │──▶│  PostgreSQL  │
│  (symptoms) │   │  (PWA/IVR)   │   │  Backend     │   │  + PostGIS   │
└─────────────┘   └──────────────┘   └──────┬───────┘   └──────────────┘
                                             │
                                   ┌─────────┼─────────┐
                                   ▼         ▼         ▼
                              Triage/ML   Celery+Redis  Weather API
                                   │         │
                                   ▼         ▼
                            ┌──────────────────────────┐
                            │  Alerts / WebSocket       │
                            │  Dashboards (Vet/Govt)    │
                            └──────────────────────────┘
```

## Features

- **Symptom Reporting** — Mobile-first form with photo upload, GPS location, multilingual
- **AI/ML Triage** — Rule-based engine flags suspected diseases, risk level, urgency, zoonotic warnings
- **Geospatial Risk Mapping** — PostGIS heatmaps of outbreaks/reports at village/block/district level
- **Weather Integration** — Weather-condition risk multipliers (flooding → Anthrax/HS, heat → ND, etc.)
- **Vaccination Tracker** — Per-animal/herd records, due-date reminders, coverage analytics
- **Lab & Sample Workflow** — Sample collection → transit → testing → results, linked to reports
- **Multi-role Dashboards** — Farmer, Field Vet, Para-Vet, Lab Tech, Govt Officer
- **Alerts** — Broadcast emergency/outbreak/weather advisories (mobile push + SMS stubs)
- **Offline-first PWA** — Service worker caching for low-connectivity villages
- **Multilingual** — English / हिंदी / मराठी / తెలుగు (i18next)

## Project Structure

```
backend/
  app/
    api/v1/endpoints/   # REST endpoints per domain
    core/               # config, db, security, celery
    knowledge_base/     # disease + vaccination knowledge
    ml/                 # model + preprocessor
    models/             # SQLAlchemy models
    schemas/            # Pydantic schemas
    services/           # triage, geospatial, notification
    tasks/              # celery tasks
  requirements.txt
  Dockerfile

frontend/
  src/
    api/                # axios client + endpoints
    components/         # layout, common, charts, symptoms
    hooks/              # useAuth, useGeolocation
    i18n/locales/       # en, hi, mr
    pages/              # per-feature pages
    store/              # zustand stores
    types/  utils/      # TS types + helpers
  public/               # PWA manifest + service worker
  Dockerfile  nginx.conf
```

## Quickstart

### 1. Prerequisites

- Docker Desktop (recommended) — includes PostGIS + Redis + backend + frontend
- Node.js 18+ and Python 3.11+ (for local dev)

### 2. Run with Docker (easiest)

```bash
docker-compose up --build
```

- Backend API → http://localhost:8000 (Swagger docs at `/docs`)
- Frontend → http://localhost:3000

Tables are created automatically on backend startup (`Base.metadata.create_all`);
run `backend/scripts/reseed_demo_data.py` to load demo records.

### 3. Run locally

**Backend**

```bash
cd backend
cp .env.example .env
# Docker services needed: postgres+postgis, redis
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### 4. Run tests

```bash
cd backend
.venv/Scripts/python -m pytest -q   # Windows
# or: pytest -q                    # Unix/macOS
```

## API Overview

| Method | Endpoint                     | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| POST   | `/api/v1/auth/register`      | Register farmer/vet/officer          |
| POST   | `/api/v1/auth/login`         | JWT login                            |
| POST   | `/api/v1/symptom-reports`    | Create report (auto-triage via ML)   |
| GET    | `/api/v1/symptom-reports/nearby` | Reports within radius (PostGIS)  |
| GET    | `/api/v1/dashboard/stats`    | Aggregate stats for dashboards       |
| GET    | `/api/v1/dashboard/disease-heatmap` | Outbreak/risk heatmap data  |
| GET    | `/api/v1/weather/risk-assessment` | Weather-based disease risk     |
| POST   | `/api/v1/alerts`             | Broadcast alert to region            |
| WS     | `/ws/alerts`                 | Real-time alert stream               |

Full interactive docs at `http://localhost:8000/docs`.

## ML Triage Logic

`backend/app/services/triage.py` implements a weighted rule engine:

- Each disease in the knowledge base defines symptom signatures per species.
- Scoring: matched symptom count × severity weight × species-boost × weather multiplier.
- Outputs: `risk_score`, `urgency_level`, `suspected_diseases` (top 3), `recommended_action`, zoonotic warning.

## Testing

Backend unit + smoke tests live in `backend/tests/` (pytest). They cover the
health/root endpoints and the rule-based triage engine (species filtering,
weather multipliers, zoonotic flags). No external services are required.

## Datasets

Suggested public sources (see `backend/scripts/` for census/outbreak import and
demo reseeding utilities):

- FAO EMPRES-i global animal disease alerts
- WOAH (OIE) disease occurrence reports
- India Livestock Census (DAHD)
- IMD / NASA POWER weather data
- Kaggle livestock / animal health datasets

## Disclaimer

This project is a working prototype for SIH. Notification (SMS/push) services are stubs; lab & weather integrations are designed to plug into production providers (Twilio, MSG91, IMD APIs).