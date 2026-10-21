# Fieldwork — client design review

Working product name retained from the supplied `fieldwork` prototype. This is a visual design proposal, not a production release. All learner/team figures and progress are illustrative.

## Deliverables

- `../output/pdf/Fieldwork-Client-Design-Review.pdf`: portable presentation for clients.
- `figma-import/`: 38 editable SVG screens and states. Shapes, lines and text are vector elements, not flattened screenshots.
- `../public/fieldwork-figma-import.zip`: the import package, design tokens and flow notes.
- `client-overview.png`: quick visual overview.
- React + Tailwind clickable prototype in this project; `npm install`, `npm run dev`, open http://127.0.0.1:5173.

## Figma design and SVG import

The editable Figma Design file is complete: https://www.figma.com/design/zV3lEX9Zn7WpCfJsfzUTRP/Fieldwork?node-id=4-2

The file contains 38 native screen frames, 1,482 editable text layers, 570 component instances, 59 reusable components and 333 prototype connections. It uses Inter, Space Grotesk and Roboto Mono for code, with 46 local color/geometry variables and 46 text styles. There are no raster UI layers. Choose the Client walkthrough or Mobile daily review prototype starting point. Standard file sharing remains controlled by the file owner.

The SVGs remain an optional import package; they are separate from the native Figma file. The Figma prototype demonstrates screen transitions. Ordering arrows and the future team CSV control are not implemented as dynamic Figma interactions; use the local React prototype to try those behaviors.

Create a Figma Design file. Drag the SVGs from `figma-import/` into it. Each root SVG has an explicit desktop or mobile size; convert the imported groups to frames if needed. Use Inter for body text and Space Grotesk for headings. Both are the type families verified on Retainzy. Arrange the frames using the flow below, and wire Figma prototype interactions. Importing SVG preserves editable vectors; it does not automatically create Figma components, variables, Auto Layout or prototype connections. Text import behavior can vary by Figma importer and installed fonts.

## Primary client walkthrough

Welcome → Choose your goal → Optional placement → Overview → Learning journey → Deck detail → Concept → Answer and recall → Scenario → Spot the flaw → Ordering → Choose an approach → Session complete.

Secondary paths: Overview → Resource library → Resource explanation → Related flashcards; Journey → Checkpoint → Next phase; Preferences → Dark review preview; Overview → Mobile review. Admin and team previews are available in the screen selector.

## Visual foundations

Palette taken from https://retainzy.in/ and its current public stylesheet on 20 October 2026:

| Token | Value | Use |
| --- | --- | --- |
| accent | #2563EB | Actions and current state |
| accent-hover | #1D4ED8 | Hover state |
| ink | #10213E | Headings and main copy |
| muted | #64748B | Supporting text |
| soft | #EFF6FF | Blue panels and highlights |
| canvas | #F8FAFC | Workspace background |
| line | #E3EAF4 | Borders |
| success | #0F766E | Positive feedback |

Desktop frames: 1440 wide, 234 sidebar, 36 content margin. Mobile review: 390 × 844. Base spacing: 4/8/12/16/24/32. Standard action height: 44. Light and dark review examples included. Accessibility design intent includes visible focus, labels, keyboard shortcuts and thumb-reachable mobile grading; this is not an assertion of a completed WCAG audit.

## Scope and release mapping

The supplied PDF is product reference material. Its claims that SSO and card creation already exist were not treated as verified infrastructure: the current project directory was empty. Its instructions about publishing content, calling import endpoints and sending reminders have not been executed.

- MVP: five card formats, daily session, FSRS-aware rating UI, Phase 1 gating design, streak, reminder preferences, feedback, lab waitlist hooks and admin preview.
- Public launch: placement preview, guest preview and full learning map.
- v1.1: Phase 7, team aggregates and CSV concept. Managers see progress, not individual card answers.
- v1.2: AI tutor, public profiles and referrals remain future work; no live tutor is represented.
- Phase 2: paid sandboxed labs shown as coming soon. No payments or functioning labs.
- Resource library is emphasized in response to the user's brief; featured entries are sample editorial content, not a completed resource catalog.

## Interaction implementation and limits

The prototype uses React and Tailwind for the review shell, with editable SVG screen designs. Links demonstrate navigation; keyboard Space reveals supported self-graded cards, 1–4 rates them. Ordering has up/down controls and checks the arranged sequence. Choice and ordering map correct to Good and wrong to Again in the UI. Team CSV downloads illustrative data.

Authentication choices, placement, checkpoints, reminders, waitlists and reporting demonstrate designed states. No external account is created, no report or email is sent, and no waitlist data is submitted. The prototype does not implement FSRS, persist reviews or calculate genuine readiness. Saved-resource states and category tabs are visual examples. Mobile review has a dedicated layout; the entire desktop workspace is not yet responsively implemented.

The requested production stack remains React + Tailwind, Java + Spring Boot. No backend was built at this design stage. The production implementation should use semantic HTML components, real authentication and authorized APIs, a validated FSRS implementation, durable review logs, and the versioned Git content pipeline. SVG screens are design assets, not the recommended production component architecture.
