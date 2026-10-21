# Devopsx.si verification — 21 October 2026

- Frontend: 4 Vitest checks passed. TypeScript check and Vite production build passed.
- Backend: 6 HTTP integration tests passed on Java 21, including the non-demo access test. Maven packaged the executable API JAR successfully.
- Browser: completed optional-name onboarding; opened the canonical lesson from the dashboard and library; marked a lesson complete; verified 6% overall and 25% concept progress.
- Admin: entered the server-side admin demo, added a paragraph to a sample draft, published it, found it in the learner library, then returned it to draft. Tested unsaved-edit navigation protection and discarded the unsaved test title.
- Media: uploaded a generated blue placeholder PNG through the file chooser. The demo file remains in the local media library for inspecting image selection.
- Flashcards: completed concept, scenario, spot-the-flaw, choice, and ordering reviews. Verified grading and recorded all five ratings.
- Responsive: inspected dashboard and journey at 390×844, verified menu open/close and navigation, and reset the viewport to desktop.
- Persistence: restarted the backend from the packaged Java 21 JAR; verified the completed lesson and edited draft persisted.
- Browser console: no captured error logs during final inspection.

The local demo intentionally retains one completed lesson and five reviewed cards from QA, along with the placeholder image and edited sample draft. Seed data remains untouched. This is still a shared local demo; production identity, per-user storage, FSRS, and deployment are future work.

Screenshots: `journey-desktop.png`, `journey-mobile.png`, `lesson-desktop.png`.
