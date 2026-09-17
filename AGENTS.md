<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Awan POS Engineering Guide

## Project Overview

This repository is a multi-tenant retail POS application. It uses:

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase Auth and Postgres
- `@supabase/ssr` for cookie-based sessions
- Zod for validation

Keep changes focused, production-oriented, and consistent with the existing codebase.

## Required Reading

Before editing Next.js code:

1. Read this file completely.
2. Read the relevant installed documentation under `node_modules/next/dist/docs/`.
3. Do not rely on remembered Next.js APIs when installed documentation differs.

Before editing Supabase schema, migrations, functions, RLS, or authentication code:

1. Review the current Supabase documentation for the feature being changed.
2. Inspect existing migrations and policies before introducing new database behavior.
3. Preserve tenant isolation for every read and mutation.

## Application Architecture

- Keep pages and layouts as Server Components by default.
- Fetch authenticated data on the server with `src/lib/supabase/server.ts`.
- Use Client Components only for state, effects, event handlers, dialogs, and other browser interactions.
- Keep client boundaries narrow. Pass only serializable data from Server Components.
- Put reusable application UI in `src/components/`.
- Put route-specific components beside their route under `src/app/`.
- Use `src/lib/workspace.ts` as the source of the authenticated organization and branch context.
- Reuse `AppSidebar` for authenticated operational pages so navigation remains consistent.

## Next.js Conventions

- Treat `params`, `searchParams`, `cookies()`, and other documented asynchronous APIs according to the installed Next.js documentation.
- Use Server Actions for authenticated mutations initiated by forms.
- Authenticate and authorize inside every Server Action. A hidden form field is never proof of ownership.
- Validate every Server Action payload with Zod before writing data.
- Call `revalidatePath`, `updateTag`, or the appropriate documented cache API after mutations.
- Call `redirect` only after required revalidation because it terminates control flow.
- Add a visible pending state to every asynchronous form with the shared `SubmitButton`.
- Use `loading.tsx` or a focused Suspense fallback for dynamic routes that can visibly wait.
- Interactive filtering should update in place. Do not submit or refresh a page for local catalog search.

## Supabase And Postgres

- Never expose a service-role key or secret key to browser code.
- Use the publishable or legacy anon key only through the configured Supabase clients.
- Enable RLS on every table exposed through the Data API.
- Scope all tenant-owned rows by `organization_id` and verify active membership.
- Prefer `security invoker` database functions. Use `security definer` only when strictly necessary and document why.
- Set a safe `search_path` on database functions and schema-qualify referenced objects.
- Revoke function execution from `public` and `anon`; grant only the roles that need it.
- Keep multi-table writes atomic by using a Postgres function when partial state would be harmful.
- Add an inventory movement for every stock change. Never update stock silently.
- Protect stock mutations against negative inventory and concurrent updates.
- Preserve historical sales and inventory records. Archive catalog entities instead of deleting them.
- Add indexes for foreign keys and columns used by tenant filters or common lookups.

## Database Workflow

- This project uses imperative migrations in `supabase/migrations/`.
- Create migrations with `npx supabase migration new <descriptive_name>` after checking the CLI help.
- Never edit a migration that has already been applied to a shared or production database. Add a new migration instead.
- Keep `src/lib/database.types.ts` synchronized with schema and RPC changes.
- When Supabase is not linked locally, provide the exact new migration file for the user to run in the SQL Editor.
- Do not ask the user to type a migration path into the SQL Editor. They must paste the SQL file contents.

## Modern UI System

The product should feel like a current, polished operations tool: calm, fast, compact, and trustworthy. Modern does not mean oversized headings, excessive cards, gradients, glass effects, or decorative animation.

### Visual Foundation

- Use a neutral application background, white work surfaces, dark readable text, and a restrained teal brand accent.
- Define shared colors, spacing, shadows, borders, and control heights as CSS variables or reusable component styles. Avoid spreading new arbitrary hex values through feature code.
- Use one clear accent color for primary actions and selection. Use green, amber, and red only for meaningful success, warning, and destructive states.
- Prefer subtle 1px borders over heavy shadows. Reserve shadows for dialogs, menus, and temporary overlays.
- Keep corner radii consistent. Use `rounded-md` or smaller for operational UI.
- Maintain strong contrast and visible keyboard focus. Do not communicate status using color alone.

### Typography And Density

- Use compact, readable typography appropriate for repeated daily use.
- Reserve large type for page titles. Panel and dialog headings should remain modest.
- Keep labels, helper text, table headers, and metadata visually distinct without making them tiny or low contrast.
- Use tabular numbers for prices, quantities, totals, and report columns when alignment improves scanning.
- Keep control heights and table rows stable so loading, validation, or dynamic content does not shift the layout.

### Layout And Navigation

- Build operational screens for fast scanning and repeated use, not as marketing pages.
- Use the shared authenticated application shell. Keep the sidebar visible on desktop and provide a compact drawer or equivalent navigation on small screens.
- Keep page headers consistent: title and context on the left, primary action on the right.
- Let lists, tables, and work surfaces use the available width. Do not permanently occupy content space with short creation forms.
- Avoid cards around entire page sections. Use cards only for individual metrics, repeated entities, dialogs, or genuinely framed tools.
- Never nest cards inside cards.
- Do not add decorative gradients, glowing shapes, glassmorphism, or animation that competes with operational data.

### Controls And Icons

- Use buttons only for actions and links for navigation.
- Use familiar icons for icon actions such as close, edit, search, filter, more actions, download, and back.
- Prefer `lucide-react` when an icon is needed. Do not hand-draw SVG icons. Install the package intentionally if the project does not have an icon library yet.
- Give icon-only buttons an accessible name and tooltip.
- Use icon plus text for important or less familiar actions such as `Add product` or `Complete sale`.
- Use checkboxes, switches, segmented controls, selects, and menus according to the type of choice instead of styling every control as a text button.
- Distinguish primary, secondary, quiet, and destructive actions consistently.

### Forms And Dialogs

- Use dialogs for short create/edit workflows that should not displace the primary list.
- Use dedicated pages for complex workflows, audit history, and tasks requiring substantial context.
- Every input needs a visible label. Placeholder text is an example, not a label.
- Group related fields, keep a logical tab order, focus the first useful field when a dialog opens, support Escape to close, and return focus to the trigger.
- Keep dialog actions in a stable footer with Cancel before the primary action.
- Show validation near the relevant control when possible and preserve entered values after recoverable errors.
- Disable submitting controls while pending and show a clear loading label without changing button dimensions.

### Data And Feedback

- Search fields should filter as the user types, use a short debounce where appropriate, and avoid full-page refreshes.
- Tables should support scanning with aligned columns, restrained headers, clear row hover/focus states, and actions placed consistently at the end.
- Keep important identifiers such as SKU and barcode visually distinct, using monospace only where it aids recognition.
- Ensure tables remain usable on small screens through responsive layouts or horizontal scrolling. Do not squeeze text until it becomes unreadable.
- Provide deliberate empty, loading, success, error, disabled, and no-results states.
- Prefer skeletons for page or table loading and inline spinners for individual actions.
- Success feedback should confirm the result without blocking continued work. Errors should explain what happened and how to recover.
- Use confirmation dialogs for destructive or difficult-to-reverse actions. Prefer archive over delete when historical records matter.

### Motion And Accessibility

- Keep transitions short and purposeful. Animate state changes, dialogs, and menus only when motion improves orientation.
- Respect `prefers-reduced-motion` and never rely on animation to communicate state.
- Use semantic HTML before adding ARIA. Add ARIA only where native semantics are insufficient.
- Support keyboard operation for navigation, dialogs, menus, forms, and table actions.
- Maintain a visible focus indicator and touch targets large enough for mobile use.

### Visual Verification

- Check changed screens at desktop and mobile widths before considering the UI complete.
- Verify that dialogs fit within the viewport, tables do not break their containers, text does not overflow, and controls do not overlap.
- When browser automation is available, capture screenshots at representative desktop and mobile viewports and inspect them for layout regressions.

## TypeScript And Code Quality

- Keep TypeScript strict. Do not introduce `any` when a concrete type can be expressed.
- Avoid broad type assertions. Fix database types or narrow unknown data explicitly.
- Prefer small, named components and functions over large duplicated JSX blocks.
- Keep formatting and naming consistent with nearby files.
- Add comments only when the reason for the code is not evident from the implementation.
- Do not leave dead imports, placeholder handlers, or controls that appear functional but do nothing.
- Do not expose internal errors or sensitive details to end users. Translate expected database errors into clear messages.

## Verification

Before completing a change, run:

```powershell
npm run lint
npm run build
```

Also verify the affected workflow manually when practical. Database changes are not complete until the migration has been applied and the relevant query or mutation has been exercised against Supabase.

Do not start or stop the development server unless the user asks. The user normally runs it manually.
