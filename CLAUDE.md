# LMS-CCIS: context for Claude (Lead role only)

Read this briefly, then continue from **Next**. Do not re-ask decided items or re-inspect files this file already describes. Conserve tokens.

## Start here (every new conversation)

1. Sync the clone (section 2). Read-only: no installs, no downloads.
2. Run the **Verify** commands (section 5) to see what has landed on `main`.
3. Reply with one short line: current state and what you will do next. Then work on **Next**.

Kickoff prompt: "Continue the LMS. Clone main, read /CLAUDE.md, verify status, continue from Next."

## 1. How we work

- **Scope: the Lead role only** (Migel). You help with infrastructure and integration: repo, Supabase project config, hosting, environment files, Git workflow, docs, PR review, offline demo. Teammates' feature code (section 4, ownership) is out of scope unless he asks; if a task touches their folders, name the owner.
- **Phases:** understand (no code) -> discuss (no code) -> implement only when he says "go" or "next". **One step at a time, small.** Present exact snippets grouped by file in implementation order: `Replace this:` (existing text, verbatim) then `with this:`. New file or heavy rewrite: exact path, one-line reason, full contents. No unrelated refactors.
- **He applies changes himself** (Windows, PowerShell, VS Code, project at `D:\Projects\pup-lms`). Give PowerShell commands one per line (no `&&`). No output files unless he asks (CLAUDE.md is the exception: downloadable `.md`). Code goes in chat.
- Match files by content. If a snippet cannot match, ask him to paste the file, then return it in full. If a change can break something before its supporting piece exists, order the steps so the risky change comes last.
- State manual steps explicitly: commands, dashboard clicks, what to paste where, env values, redirect URLs.
- **Cannot run Angular, Supabase, Docker or a browser here.** Verify by applying each snippet to a scratch copy with an exact-match script (each "Replace this" must match once) and by parsing JSON/TOML/YAML. Say "syntax-checked" vs "not run". He runs `npm start`, `ng build`, `npx supabase ...` and sends output or screenshots.
- **Never ask for or paste secrets** (service_role key, Google client secret, DB password). The Supabase project URL and anon key are fine.
- **Tokens:** `grep -n`, `sed -n` ranges only; never cat big files. Concise replies, at most one question per reply (prefer a stated default). Be direct; flag risks and unverified guesses honestly.
- Windows gotchas: never `Move-Item` a project across drives (it split this repo once); if `ng` is blocked, `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`; npm 11 prints harmless `allow-scripts` warnings; never run `npm audit fix --force`.

## 2. Seeing the code

```bash
mkdir -p /home/claude/lms && cd /home/claude/lms
[ -d repo ] || git clone --depth 1 https://github.com/migeltan/CCIS-LMS.git repo
cd repo && git fetch --depth 15 origin main && git reset --hard FETCH_HEAD && git log --oneline -5
```

- Read-only reference; never push. It shows only what is **pushed to `main`**; his local copy is often ahead (treat unpushed work as intentional). If the clone fails (private repo or different URL), ask him for the exact URL; do not guess.
- Never run `npm install`, `npm ci` or `pip install`. Ignore `node_modules` and `package-lock.json`.

## 3. Project

Classroom/Canvas-style LMS for CCIS, PUP. School project for Systems Integration and Architecture, but it must be **actually usable by about 50 students plus the professor, on a free stack**. Team of 5 (3rd years). **Deadline: Nov 11, 2026.** Full plan: `docs/Project_Plan.md` (source of truth for roles, timeline, flowcharts, ERD; do not re-read it in full, grep a section).

**Goal:** teachers take courses and handle sections; they post announcements, upload materials (PDF/PPT/links) and create activities; students join a section with a code, see the stream, materials and activities, submit work and see grades. Quizzes are Google Form links. Admin approves teachers. Must also run offline for the demo.

| #   | Role                                           | Side                                       |
| --- | ---------------------------------------------- | ------------------------------------------ |
| 1   | Lead / DevOps / Integration (Migel, this file) | repo, hosting, config, reviews             |
| 2   | Database / Supabase                            | backend: migrations, RLS, functions, seed  |
| 3   | Auth / Admin / App shell                       | frontend core, login, guards, layout       |
| 4   | Teacher side                                   | courses, sections, stream, materials       |
| 5   | Student side + activities                      | dashboard, activities, submissions, grades |

**Timeline:** Oct 27-28 setup; Oct 29-30 schema v1, login, shell, deployed URL; Oct 31-Nov 2 courses and sections (Nov 1-2 flex); Nov 3-4 stream and materials; Nov 4-6 activities and submissions; Nov 6-7 grading and admin, **feature freeze end of Nov 7**; Nov 8-9 integration and offline test; Nov 10 rehearsal; **Nov 11 demo**. Cut order if late: comments, people list, grade release toggle, admin page, Google sign-in.

## 4. Decisions / rules already made (do not re-ask)

- **Stack:** Angular (standalone, new `app.ts`/`app.html` file naming) + Angular Material; Supabase (Postgres, Auth, Storage, RLS); **no separate backend server** (Laravel dropped: free PHP hosting is weak). Custom logic = Postgres RPC or Edge Functions. Hosting: Cloudflare Pages or Vercel (pick one at A5), auto-deploy `main`. Offline demo = Docker + local Supabase + built Angular on one laptop; designed now, tested Nov 8-9; Google sign-in needs internet, so offline uses seeded email/password.
- **Repo layout:** `frontend/` Angular, `backend/` Supabase CLI project, `docs/`, `.github/`. All schema changes are **migration files** in `backend/supabase/migrations/`; never click schema in the dashboard, never edit an applied migration.
- **Auth:** Google sign-in plus email fallback; only `@iskolarngbayan.pup.edu.ph` (also enforced by a DB trigger); teacher domain unconfirmed and may differ. Default role `student`; admin approves `teacher`. Role checks in both Angular guards and RLS.
- **Secrets:** project URL and anon key are committed in `frontend/src/environments/` (RLS protects data). Never commit service_role, Google client secret or DB password.
- **Git:** `main` protected (PR + 1 review); short-lived branches `feat/<area>-<task>`, `fix/`, `db/`; squash merge; no shared `feat` branch, no `dev` branch; after the Nov 7 freeze only `fix/` PRs. Branches live at most 2 days.
- **Ownership (Lead's files):** `.github/` (CODEOWNERS, PR template), `docs/`, root `README.md`, `frontend/angular.json`, `frontend/src/environments/`, `backend/package.json`, `backend/supabase/config.toml`, hosting settings. Others stay in their own folders; DB person regenerates `frontend/src/app/core/models/database.types.ts`; frontend codes against mock services until schema v1 (target Oct 30).
- Setup was split: Lead does Part A of the plan, teammates then clone, `npm install`, `npm start`.

## 5. Where things are and status

```
pup-lms/ (local folder; GitHub repo migeltan/CCIS-LMS)
  frontend/  Angular app (src/app, src/environments, angular.json)
  backend/   Supabase CLI (package.json, supabase/config.toml, migrations/ later)
  docs/      Project_Plan.md (plan, roles, flowcharts)
  .github/   PULL_REQUEST_TEMPLATE.md, CODEOWNERS (later)
  .gitignore, README.md, CLAUDE.md
```

**Done locally (as of Oct 28, branch `main`, check `git log` for what is pushed):** `git init -b main`; Angular scaffold with Material, `ng generate environments` and `@supabase/supabase-js`; `npm start` shows the Angular starter page from `D:\Projects\pup-lms`; `backend/` with Supabase CLI 2.122.0 and `supabase init`; root `.gitignore`. README and PR template added after the first push. **Not done:** first commit and push, Supabase project link, any migration, storage buckets, Google OAuth, real values in `environment.ts` (currently a near-empty default), hosting, CODEOWNERS, branch protection, teammates' onboarding.

**Verify (run in the clone):**

```bash
cd /home/claude/lms/repo && git log --oneline -3
ls frontend/src/environments backend/supabase
ls backend/supabase/migrations 2>/dev/null
grep -n "supabaseUrl" frontend/src/environments/environment.ts
ls .github docs
```

Gotchas: README's clone path must match the repo folder name; Angular files are `app.ts`, `app.html`, `app.config.ts`, `app.routes.ts` (no `.component`); `.github` and `docs` stay invisible to Git while empty.

## 6. Next (Lead's queue, one at a time; say "go" before each)

1. Repo hygiene: add teammates as collaborators, protect `main` (PR + 1 review), then CODEOWNERS with their real GitHub usernames.
2. **A3:** link the Supabase project (`npx supabase login`, `link`), empty `init_schema` migration, `db push`, private buckets `materials` and `submissions` with size limit, Google OAuth client, Site URL and redirect URLs (`http://localhost:4200` and the deployed URL).
3. **A4:** fill `environment.ts` and `environment.development.ts` with project URL and anon key; `environment.local.ts` and `start:local` later for offline.
4. **A5:** hosting (root `frontend`, build `npm run build`, SPA fallback, test a deep-link refresh).
5. **A6 leftovers:** CODEOWNERS (needs teammates' GitHub usernames).
6. **A7:** fresh-clone test (`npm install`, `npm start`), then the announcement message to the group.
7. After that: setup spike checklist (plan Section 6, due Oct 29), review the schema v1 PR, deployed URL by Oct 30, then PR review and integration.

## 7. Known risks (state them, do not hide them)

- Free-tier limits are not yet verified (Supabase idle pausing, storage and upload caps); check on Oct 28 and again before the demo.
- Teacher email domain unconfirmed: the domain restriction may block teachers.
- Schema v1 (Oct 30) is the early bottleneck; everyone else uses mocks until then.
- Docker Desktop (and WSL2) for the offline demo is not confirmed installed on the Lead's laptop; setup can eat time.
- 15 days is tight; merge conflicts in the last week; branch protection may not be enforced on a free private repo.

## 8. Updating this file

Only when the conversation nears ~90% usage, he says it is ending, or he asks: update sections 5-7 only, deliver the full file once as a downloadable `.md` (dense, under ~130 lines, drop stale detail), and remind him to commit it to the repo root and push to `main` so a fresh clone sees it.
