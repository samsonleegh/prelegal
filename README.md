# prelegal

A platform for drafting common legal agreements.

## Status

This project is currently in progress and is expected to be completed in 1 week (by 2026-05-28).

## Architecture

- **Backend** (`backend/`) — FastAPI app managed with `uv`, serves the `/api/*` routes and the built frontend.
- **Frontend** (`frontend/`) — Next.js 16 app (static export). Built into `frontend/out/` and copied into the backend image as `backend/static/`.
- **Database** — SQLite, recreated from scratch on every container start. Currently only stores users registered through the placeholder sign-in screen.
- Everything is packaged into a single Docker container exposed on port **8000**.

## Run with Docker

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Open <http://localhost:8000>. The first screen is a placeholder sign-in (no password). Submitting drops you into the MNDA creator.

## Local development

The Docker container is the source of truth, but each piece can also be run directly:

```bash
# Backend (FastAPI on :8000)
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Frontend (Next.js dev on :3000)
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

### Tests

```bash
cd backend
uv run pytest
```
