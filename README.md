# Constellation Coach (Prototype)

Responsive React + TypeScript web prototype for an AI-powered learning tracker.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Router
- React Flow + dagre (graph rendering + layout)
- Express API route for course-material extraction (`/api/courses/create`)
- OpenAI Node SDK (server-side only)
- LocalStorage persistence
- Deterministic mock AI layer for explain/quiz flows

## Features

- Unified Galaxy Workspace (`/` and `/course/:courseId`)
  - Landing view shows course suns with orbiting preview stars
  - Hover a sun for a visible `Remove` control with confirmation dialog
  - Click a sun -> smooth camera zoom into selected course (same workspace)
  - `Back to Galaxy` reverses zoom and restores all courses
  - `Add Course` modal with syllabus/topic input and optional file attachments
  - New courses auto-generate a 20-35 node concept graph (DAG prerequisites)
- Add Course via attachments (PDF/PPT/PPTX/DOCX/TXT/MD)
  - Upload files + optional syllabus text
  - API uploads files to OpenAI Files API
  - Responses API returns structured concept graph JSON (nodes + prerequisite edges)
  - Graph is persisted in localStorage and used immediately in galaxy/course views
  - If extraction fails, app falls back to local mock graph generation and shows a warning banner
- In-course tabs
  - `Overview`: connected prerequisite graph view for subtopics/concepts
  - `Map`: zoomed solar-system course map (sun + orbiting concept stars)
  - Default on sun click: `Map`
  - Default on star click: `Map` with that concept pre-selected
- In-course concept interaction
  - Click a node/star to open sidebar details and learning actions
  - Node colors by mastery: red/yellow/green (+ gray for unattempted)
  - Rust indicator + mastery decay after 7 days without practice
  - First-attempt gate: Explain to AI required before quizzes
- Learning flow modals
  - `Explain to AI`: mock alignment evaluation with scores + recommendations
  - `MCQ Quiz`: full (5 Qs) or quick check (3 Qs), explanations per question
  - `Watch Recap`: placeholder link + small mastery update
- Deterministic behavior
  - Seeded random for graph generation and AI outputs
  - Cleanly separated mock AI service in `src/lib/mockAi.ts` for easy real-API replacement

## Folder Structure

- `src/components/` reusable UI and modal/graph components
- `src/pages/` route-level pages
- `src/lib/` mock generators, store, layout, mastery logic
- `src/types/` strong TypeScript models

## Run (Client + API)

```bash
npm install
npm run dev
```

Set server env vars before running if you want file-based extraction:

```bash
export OPENAI_API_KEY=your_key_here
# optional
export OPENAI_MODEL=gpt-4.1-mini
```

Then run:

```bash
npm run dev
```

Open app: `http://localhost:5173`  
API runs on: `http://localhost:8787` (proxied via Vite `/api`)

## Build

```bash
npm run build
npm run preview
```

## Notes

- Data is stored in browser `localStorage` key: `constellation-coach-state-v1`.
- `OPENAI_API_KEY` stays server-side only.
- Without API key, regular text-based course creation still works. File-based extraction falls back to mock graph generation.
- Explain/quiz actions remain mocked in `src/lib/mockAi.ts` (no client-side API key use).
- Navigation flow:
  - Select course from galaxy (sun/star)
  - In course context, switch tabs: `Overview` / `Map`
  - Select concept -> Explain/Quiz actions -> mastery updates
- Add-course flow:
  - Enter title + (syllabus text and/or files)
  - App calls `/api/courses/create` for extraction
  - New course appears in galaxy with preview stars
  - File limits: up to 8 files, 15MB each (`.pdf`, `.ppt`, `.pptx`, `.docx`, `.txt`, `.md`)
