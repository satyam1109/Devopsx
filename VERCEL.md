# Frontend deployment

Deploy the repository root as a **Vite** project on Vercel's existing Hobby workspace. Build with `npm run build`, install with `npm ci`, publish `dist`, and use Node.js 24. The Spring Boot backend is deployed separately on Render; Vercel does not build or run Java.

`vercel.json` proxies `/api/*` to `https://devopsx-api.onrender.com/api/*` before the React Router SPA fallback. Frontend requests use the same origin, so no browser CORS exception or frontend API secret is needed. API responses are marked private/no-store. Static assets come from `dist`.

## Current demo behavior

- Published sample content is fetched from the Render API and PostgreSQL database.
- The hosted backend disables local demo role switching. Anonymous visitors use a guest workspace: name, track, daily goal, bookmarks, completed lessons, and review ratings are stored under `devopsx:guest:v1` in the current browser's local storage.
- Guest progress is not uploaded to PostgreSQL or shared across devices. Clearing site data resets it. Storage failures are surfaced before showing success.
- The hosted admin portal displays an access notice. Real sign-in and per-user backend storage are future work. Do not enable the backend's local demo profile publicly.
- Local development retains its existing server-backed demo and admin authoring workflow.
- Learner-created flashcards and personal overrides are saved separately under `devopsx:personal-flashcards:v1` in browser storage in both local and hosted modes. They never overwrite the shared catalog. Reviews of personal cards also stay in this browser and use the existing scheduling rules; unmodified cards retain the current demo/guest storage behavior. The learner UI and admin portal share the same flashcard fields.
- Render's free service can take time to wake up. If a request fails during startup, use **Try again** once it is awake. See `backend/RENDER.md` for the database expiry date and deployment details.

## Release checks

Run `npm test` and `npm run build` before pushing `main`. Verify the deployed `/api/health`, `/api/catalog`, and `/api/session` routes return JSON, a direct `/lessons/models-1` visit opens the reader, and guest progress survives a reload. Verify `/api/admin/content` and `/api/progress` remain unauthorized for anonymous visitors and the hosted UI has no admin demo entry button.

The GitHub repository is `satyam1109/Devopsx`. Keep production deployments tied to reviewed commits on `main`.
