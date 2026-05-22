# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The product target is to support every document type in `catalog.json` via AI chat with full user authentication and document persistence. See the "Current state" section at the bottom of this file for what is actually implemented today.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically built (`next build` with `output: "export"`) and served by FastAPI out of `backend/static/`.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Current state

Implemented through PL-4:

- **Templates dataset** (PL-2): 12 Common Paper templates under `templates/`, indexed by `catalog.json`.
- **MNDA creator** (PL-3): client-side form → live preview → PDF download (`@react-pdf/renderer`). Lives at `/mnda`. Code under `frontend/app/mnda/` and `frontend/components/Mnda*`.
- **V1 foundation** (PL-4):
  - `backend/` — FastAPI + uv project. SQLite `users` table recreated on every container start. `POST /api/auth/fake-login` upserts a user by email.
  - `frontend/` — Next.js 16 static export served by FastAPI from `backend/static/` (built into the image during `docker build`).
  - `/` is a placeholder sign-in (name + email → fake-login → `localStorage`); `/mnda` is gated on the stored user.
  - `Dockerfile` + `docker-compose.yml` package everything into one container on :8000.
  - `scripts/{start,stop}-{mac,linux}.sh` and `scripts/{start,stop}-windows.ps1` wrap `docker compose up --build` / `down`.
  - Backend tests: `cd backend && uv run pytest` (5 cases, covers `/api/health` and the fake-login flow).

Not yet implemented: AI chat for filling fields, real authentication, document persistence, and every document type other than MNDA.