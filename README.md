# CCIS LMS

Classroom-style LMS: Angular (frontend) + Supabase (backend). Full plan, roles, and flowcharts: `docs/Project_Plan.md`.

## Quick start

1. Install Node.js (current LTS), Git, and VS Code.
2. Clone and run:

   ```
   git clone https://github.com/migeltan/CCIS-LMS.git
   cd CCIS-LMS/frontend
   npm install
   npm start
   ```

3. Open http://localhost:4200

If `npm start` complains about your Node version, update Node to the current LTS.

## Rules

- Never push to `main`. Create a branch: `git checkout -b feat/<area>-<task>`
- Open a Pull Request and get 1 review before merging.
- Stay in your own folders (see Section 3 of the plan).
- Never commit secrets (service_role key, Google client secret, DB password).

## Layout

- `frontend/`: Angular app
- `backend/`: Supabase (migrations, RLS, functions, seed)
- `docs/`: plan and diagrams
