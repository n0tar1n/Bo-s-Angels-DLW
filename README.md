# Constellation Coach (Prototype)

Responsive React + TypeScript web prototype for an AI-powered learning tracker.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- React Router
- React Flow + dagre (graph rendering + layout)
- LocalStorage persistence
- Deterministic mock AI layer (no backend/API calls)

## Features

- Unified Galaxy Workspace (`/` and `/course/:courseId`)
  - Landing view shows course suns with orbiting preview stars
  - Click sun/star -> smooth camera zoom into selected course (same workspace)
  - `Back to Galaxy` reverses zoom and restores all courses
  - `Add Course` modal with syllabus/topic input
  - New courses auto-generate a 20-35 node concept graph (DAG prerequisites)
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

## Run

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Notes

- Data is stored in browser `localStorage` key: `constellation-coach-state-v1`.
- No backend is required.
- If you want to connect real AI calls later, replace the methods in `src/lib/mockAi.ts` and keep the same return types.
- Navigation flow:
  - Select course from galaxy (sun/star)
  - In course context, switch tabs: `Overview` / `Map`
  - Select concept -> Explain/Quiz actions -> mastery updates
