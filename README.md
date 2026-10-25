# Devopsx.si

A working study application for DevOps and cloud engineers learning AI and forward deployed engineering. The UI follows the approved blue Devopsx.si design, with semantic, reusable React components rather than the earlier SVG prototype.

## Run locally

Requirements: Node.js 22.12 or newer, npm, and Java 21+. Maven is downloaded by the included wrapper on first use.

From this directory, install the frontend dependencies:

```sh
npm ci
```

Start the backend in one terminal:

```sh
cd backend
./mvnw spring-boot:run
```

Start the frontend in another terminal, from the project root:

```sh
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). The backend listens on `127.0.0.1:8091`; Vite proxies `/api` requests to it. If a port is occupied, Vite prints its next available port.

For a different backend port, set `PORT` for Spring Boot and `DEVOPSX_BACKEND_URL` for Vite. See `.env.example` for examples. Vite environment variables must be exported in the terminal or supplied through the command; no environment-file loader is configured for the server proxy.

## Included now

- Simple optional-name onboarding, track selection, and daily learning goal.
- Overview, guided journey, main concept pages, topic pages, and searchable resource library.
- A single canonical `/lessons/:id` route from every entry point, with a full-width reading workspace beside the sidebar.
- Overall, concept, and topic progress derived from saved lesson completions. Shared concepts retain the same lesson progress across tracks.
- Saved lessons, previous/next navigation, and persisted preferences.
- Clickable learner profile with saved lessons, learning details, and progress. Dashboard review/goal cards link to Flashcards and the daily-goal controls. Library search supports an explicit Search button or Enter, concept/topic names, and saved-item filters that survive reloads in the URL.
- Five demo flashcard formats: concept, scenario, spot the flaw, choice, and ordering. Choice and ordering are automatically graded; all formats support self-rating and persist their next review time.
- Learners can create personal flashcards and edit their own versions of published cards. A shared editor supports all five formats. Personal cards, edits, and their subsequent reviews persist in this browser only; admin originals remain unchanged. Existing review history carries forward when personalizing a card. Real account ownership and cross-device sync are pending.
- Admin portal at `/admin`, including content creation/editing, parent selection, shared concept-to-track assignments, display order, draft/published/archived states, and guarded deletion.
- Lesson block editor for paragraphs, headings, bullet lists, callouts, code, images, and external links. Preview uses the same renderer as the learner reader.
- Reusable media library, image upload, accessible alternative text, and protection against deleting referenced images.
- Mobile navigation drawer, responsive layouts, keyboard focus states, keyboard review shortcuts, focus-trapped preview/confirmation dialogs, and protection against leaving unsaved admin edits.

All study material is dummy content. There are 2 tracks, 7 main concepts, 10 topics, 20 published sample lessons, 1 sample draft, and 5 example cards in the seed. External resource links point to `example.com`. No AI service is called and no real learning material is uploaded.

## Admin authoring workflow

1. Open **Admin portal**, then **Enter admin demo**.
2. Create a **track**. Create **main concepts** and assign them to one or more tracks.
3. Create **topics** under a main concept.
4. Create **lessons** under a topic. These are the individual study subtopics in the product hierarchy.
5. Add and order lesson blocks. Upload images in the media library, then select them in an image block, or supply an image URL. Add supporting URLs with external link blocks.
6. Add flashcards under the corresponding lesson.
7. Save drafts as needed. Set the item to **Published** and save to make it available.

A lesson is visible to learners only if its topic, concept, and at least one associated track are also published. Saving a draft does not expose it in the library. Archiving a parent hides its descendants. Use order numbers to control sequencing within a parent. Stable lesson IDs connect the journey, library, bookmarks, flashcards, and completion state.

Deleting an item with children or track assignments is blocked. Move/remove those references first, or archive it. Deleting a lesson also clears its completion; archiving preserves progress. Deletion is permanent in this first local version, so archive material you may need later.

## Project structure

```text
src/
  components/       Shared UI primitives and lesson block renderer
  context/          Catalog, demo session, preferences, progress, API actions
  layouts/          Workspace navigation and focused-reader layout
  lib/              API client, types, hierarchy/progress/search selectors
  pages/            Learner screens and flashcard review
  admin/            Content management, editor, preview, and media library
backend/
  src/main/java/si/devopsx/
    content/        Shared content model, validation, publishing rules, CRUD
    learning/       Lesson completion, preferences, and review scheduling
    media/          Image storage and validated uploads
    security/       Session roles and CSRF protection
    web/            API error handling
  src/main/resources/
    schema.sql      Local database schema
    seed.json       Dummy content loaded only into an empty database
    application.properties
  src/test/         HTTP integration tests
```

Frontend: React 19, TypeScript, React Router, Tailwind CSS 4, shared CSS theme, Lucide icons, and local Inter/Space Grotesk fonts. Backend: Java 21 target, [Spring Boot 4.1.1](https://docs.spring.io/spring-boot/system-requirements.html), Spring Security, Spring JDBC, and H2.

The old design prototype, approved Figma references, and design exports are retained under `design/`. They are not served as application screens. Figma API inspection was unavailable during implementation because the connected account had exhausted its tool quota; implementation used the saved approved references.

## Persistence and API

H2 stores content, preferences, completions, card review state, and image bytes in `backend/data/devopsx.mv.db` when launched from the backend directory. That directory is ignored by Git. Restarting the server preserves these records. Changing `seed.json` does not overwrite existing admin edits. Back up the database while the server is stopped before replacing your local data.

Key endpoints:

| Endpoint                                | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| `GET /api/catalog`                      | Published content with published ancestors |
| `GET /api/session`                      | Current role and CSRF token                |
| `POST /api/demo/session`                | Local demo role selection                  |
| `GET /api/progress`                     | Completions and scheduled card reviews     |
| `PUT/DELETE /api/progress/lessons/{id}` | Complete/uncomplete a lesson               |
| `GET/PUT /api/preferences`              | Learning goal, track, name, saved lessons  |
| `POST /api/reviews`                     | Record a card rating and next review       |
| `GET/POST /api/admin/content`           | List/create all content                    |
| `PUT/DELETE /api/admin/content/{id}`    | Edit/delete content                        |
| `GET/POST /api/admin/media`             | List/upload images                         |
| `GET /api/media/{id}`                   | Read uploaded image bytes                  |
| `DELETE /api/admin/media/{id}`          | Delete an unreferenced image               |

Admin endpoints require an ADMIN server session. Mutating endpoints require the CSRF token supplied by `/api/session`. Image uploads are limited to 5 MB and checked for PNG/JPEG/GIF/WebP signatures; SVG uploads are rejected. URLs are validated for http/https, with managed image URLs also allowed. Lesson text is rendered as text, not arbitrary HTML.

## Demo boundaries and next release

This is a local first release, not a production authentication system. The default `demo` profile deliberately allows switching into the admin demo. Learning preferences and progress belong to one shared local demo profile. The server binds to loopback. Do not expose this profile publicly or enter private content. Outside the `demo` profile, the demo role endpoint is disabled and admin access stays closed until real authentication is configured.

Before production: add identity-provider sign-in, individual users and per-user progress, production database migrations/backups, authorization tied to real accounts, and production media storage/access controls. Review scheduling currently uses transparent rating-based intervals (Again: 10 minutes, Hard: 1 day, Good: increasing 2-day steps capped at 30 days, Easy: increasing 4-day steps capped at 60 days). FSRS, placement tests, checkpoint gates, billing, teams, email reminders, and analytics are not implemented in this study-first release.

## Verify

```sh
npm test
npm run build
```

```sh
cd backend
./mvnw test
./mvnw package
```

The frontend tests cover shared ordered lesson IDs, scoped progress, combined library filters, and due-card filtering. Backend HTTP integration tests cover admin authorization, CSRF, publishing/draft ancestry, hierarchy and URL validation, answer validation, idempotent completion, preferences, scheduling, uploads, referenced-media protection, and disabling demo role switching outside the demo profile. Tests use an isolated in-memory database and do not change the local demo database.

## Render backend deployment

See [backend/RENDER.md](backend/RENDER.md) for the Docker deployment, managed PostgreSQL settings, health check, free-tier lifecycle, and the current authentication boundary. The `production,render` profiles are separate from the local H2 demo.

## Vercel frontend deployment

See [VERCEL.md](VERCEL.md) for Vite build settings, the same-origin Render API proxy, and the hosted guest demo. Hosted guest preferences and progress are saved in the browser until real sign-in is added; published sample lessons come from Render/PostgreSQL. Admin demo access remains local only.
