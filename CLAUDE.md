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

Implemented through PL-6:

- **Templates dataset** (PL-2): 12 Common Paper templates under `templates/`, indexed by `catalog.json`.
- **V1 foundation** (PL-4):
  - `backend/` — FastAPI + uv project. SQLite `users` table recreated on every container start. `POST /api/auth/fake-login` upserts a user by email.
  - `frontend/` — Next.js 16 static export served by FastAPI from `backend/static/` (built into the image during `docker build`).
  - `/` is a placeholder sign-in (name + email → fake-login → `localStorage`); the drafting page is gated on the stored user.
  - `Dockerfile` + `docker-compose.yml` package everything into one container on :8000. `docker-compose.yml` reads `OPENROUTER_API_KEY` from `.env` via `env_file`.
  - `scripts/{start,stop}-{mac,linux}.sh` and `scripts/{start,stop}-windows.ps1` wrap `docker compose up --build` / `down`.
- **Generic document drafter** (PL-3 prototype → PL-5 AI chat → PL-6 generalized to all templates): lives at `/draft`.
  - `backend/app/templates.py` loads `catalog.json` + each template's markdown at import time, extracts the inline cover-page variables from `<span class="(coverpage_link|keyterms_link|orderform_link)">VAR</span>` markers, and dedupes possessive forms.
  - `GET /api/templates` returns the catalog (name, description, variable list, full markdown content) for the frontend to render previews.
  - `POST /api/draft/chat` calls `openrouter/openai/gpt-oss-120b` via Cerebras (LiteLLM) with structured outputs returning `{reply, patch: {template_key?, values?}}`. Two-stage system prompt: first identifies which catalog template the user wants (or politely offers the closest match if the request is outside the catalog), then asks one focused question at a time to fill the variables. Code in `backend/app/llm.py`.
  - Frontend: `app/draft/page.tsx` owns the `DraftState = {templateKey, values}`. `DraftChat` is the chat panel (refocuses the textarea after every send). `DraftPreview` + `DraftPdfDocument` share `lib/templateRender.ts`, which parses the markdown into block + span trees and substitutes variable values inline. `DraftDownloadButton` produces a PDF via `@react-pdf/renderer`.
- Backend tests: `cd backend && uv run pytest` (15 cases — health, fake-login, template loading, and the draft chat route with a mocked LLM).

Not yet implemented: real authentication, document/chat persistence, and bespoke per-template UX (e.g. structured term-length pickers).