# Veldr / NoteFlow Handoff

Date: 2026-07-24
Workspace: `C:\_dD\00packages\src\veldr`
Repository target: `lieshy521-9577/veldr`

## Current Status

This repo currently contains:

- `backend/`: shared Node/Express backend for Veldr articles and NoteFlow CMS.
- `frontend/`: Veldr frontend, usually served locally on `http://localhost:5173`.
- `cms-frontend/`: NoteFlow CMS frontend, usually served locally on `http://localhost:5174`.
- `scripts/`: deployment scripts for frontends, backend, nginx, and runtime data flows.

The current working tree has uncommitted changes:

- `backend/modules/cms/cmsRoutes.js`
- `backend/tests/cms.test.js`
- `cms-frontend/index.html`
- `cms-frontend/package-lock.json`
- `cms-frontend/package.json`
- `cms-frontend/public/app.js`
- `cms-frontend/src/markdown-runtime.js`

Ignored local runtime/config files matter for deployment:

- `backend/.env.prod` is ignored by git.
- `backend/public/data/cms/` is ignored by git.
- `cms-frontend/dist/` is ignored by git.

## Completed Recently

### Security / Auth

- Veldr article write APIs, upload write APIs, and password mutation APIs were moved behind backend auth.
- Password storage was changed away from plain text for Veldr main admin flows.
- Frontend auth was adjusted to rely on backend session/cookie state rather than localStorage as the source of truth.

### CMS Integration

- `github-cms` was removed from the active direction.
- CMS frontend was migrated into this repo as `cms-frontend/`.
- The backend now serves NoteFlow CMS APIs under `/api/cms`.
- Veldr frontend and CMS frontend remain independent frontends over the same backend.

### NoteFlow CMS UI

- Desktop card/tag layout was improved.
- Mobile navigation was redesigned around:
  - compact top navigation
  - Notebook bottom sheet
  - Filter bottom sheet
  - hidden sidebar/toc on mobile
- Notebook behavior:
  - `Docs` is the aggregate/all-notes view.
  - Other notebooks are scoped views.
  - Tags are global, but tag filtering is applied within the current notebook scope.

### Markdown Editor

- Adopted the lightweight route: `textarea + live preview`, not CodeMirror.
- Added dependencies:
  - `marked`
  - `dompurify`
- Added shared Markdown rendering in `cms-frontend/src/markdown-runtime.js`.
- Details page and editor preview use the same render path when available.
- Toolbar now supports common Markdown inserts:
  - H1, H2
  - Bold, Italic
  - Quote
  - UL, OL, Task
  - Inline code, code block
  - Table
  - Link
  - Image
- Editor supports:
  - split/write/preview modes
  - mobile default write mode
  - word/line/read-time/notebook status bar
  - keyboard shortcuts
  - Tab / Shift+Tab indentation
  - pasted image upload
  - dropped image upload

### Single-User Sync

The CMS now has a lightweight single-user sync model:

- Notes have normalized `version`, `createdAt`, and `updatedAt`.
- Existing legacy notes are returned with fallback metadata.
- `PUT /api/cms/notes/:id` rejects stale writes with `409 VERSION_CONFLICT`.
- Frontend sends current note version on update.
- Frontend autosaves existing notes after a debounce.
- Frontend refreshes from server on focus/visibility return.
- Conflict handling lets the user either load the server copy or force overwrite.

## Verification Already Done

These checks passed during the latest work:

- Backend test suite passed.
- `npm run build` passed in `cms-frontend`.
- Markdown rendering verified in browser:
  - headings
  - table
  - task list
  - delete text
  - blockquote
  - fenced code block
  - script/XSS input did not execute
- Mobile editor verified at narrow viewport:
  - default write mode
  - preview hidden until switched
  - toolbar horizontally scrolls instead of overflowing
- Autosave verified:
  - existing note version incremented from `1` to `2`
  - frontend showed autosave status
  - no browser console error/warn was observed during that test

Screenshots from the latest browser QA:

- `C:\Users\indep\AppData\Local\Temp\noteflow-markdown-editor-desktop.png`
- `C:\Users\indep\AppData\Local\Temp\noteflow-markdown-editor-mobile-true.png`
- `C:\Users\indep\AppData\Local\Temp\noteflow-autosave-version.png`

## Important Risks Before Publishing

### 1. CMS Auth Is Still Lightweight

CMS auth currently checks the editor key directly. It is not yet the same HttpOnly Cookie + JWT flow used by the Veldr admin auth.

Relevant files:

- `backend/modules/cms/cmsAuth.js`
- `backend/modules/cms/cmsRoutes.js`

Risk:

- A six-digit password is convenient for one-person multi-device use, but weak if directly exposed to the public internet.
- `/api/cms/auth` should get rate limiting before production exposure.
- Consider adding one of these before or soon after publishing:
  - `express-rate-limit` on `/api/cms/auth`
  - Cloudflare Access
  - Nginx IP allowlist
  - VPN-only access
  - migrating CMS auth to the existing backend JWT cookie flow

### 2. Local CMS Runtime Data Contains Test Text

Local ignored CMS data currently includes autosave test text:

- `backend/public/data/cms/db.json`

Known marker:

- `Autosave QA 1784873376426`

If local CMS data is uploaded to the server, clean this first unless the test note is intentionally kept.

### 3. Backend Deploy Does Not Upload Local Runtime Data by Default

The backend deploy script intentionally excludes runtime data and uploads:

- `backend/public/data`
- `backend/public/uploads`

This protects server data during normal backend releases, but it means local notes and images will not be transferred unless a separate data sync/upload step is used.

Relevant file:

- `scripts/deploy-backend.ps1`

### 4. CMS Password Can Be Changed From Frontend

CMS now supports changing the editor password from the frontend while in editor mode.

Implementation:

- `PUT /api/cms/password`
- requires editor access
- verifies the current editor password
- accepts a new 6-digit numeric password
- persists it to the CMS secret file
- the CMS secret file now takes precedence over `.env.prod`

`backend/.env.prod` is still ignored by git, but after the first frontend password change the runtime secret becomes the durable CMS password source.

### 5. Autosave Conflict Reload Edge Case Fixed

The conflict reload path now suppresses autosave while remote note content is copied into the editor.

Fixed area:

- `cms-frontend/public/app.js`

This should avoid unnecessary version increments after choosing the server copy during a version conflict.

## Deployment Notes

Server IP previously used:

- `8.159.128.180`

Domains observed:

- `lifetip.top`
- `node.lifetip.top`
- `notes.lifetip.top`
- `cms.lifetip.top`

Local SSH key requested by user:

- `C:\Users\indep\.ssh\id_ed25519`

Before publishing, confirm:

- Backend env contains a deliberate `DEFAULT_PASSWORD` and `JWT_SECRET`.
- Backend runs on Node 20.x.
- Frontend deploy uploads complete `dist/` directories, including `assets/`.
- Nginx proxies `/api/` and `/uploads/` to backend correctly.
- CMS frontend `config.js` points to the intended `/api/cms` and `/uploads/cms`.
- Decide whether this release should preserve server data or overwrite/sync from local data.

## Suggested Next Steps

1. Add rate limit to `/api/cms/auth`.
2. Clean local test text from CMS runtime data if local data will be published.
3. Verify frontend password change in the browser before publishing.
4. Run:
   - `npm test -- --hookTimeout=30000` in `backend`
   - `npm run build` in `cms-frontend`
   - `git diff --check`
5. Commit the current feature set.
6. Publish backend and frontends.
7. If needed, separately sync CMS data and uploaded images to the server.

## Useful Local Commands

Backend:

```powershell
cd C:\_dD\00packages\src\veldr\backend
npm test -- --hookTimeout=30000
npm start
```

CMS frontend:

```powershell
cd C:\_dD\00packages\src\veldr\cms-frontend
npm run build
npm run dev -- --host 0.0.0.0 --port 5174
```

Git review:

```powershell
cd C:\_dD\00packages\src\veldr
git status --short
git diff --check
```

## Product Direction

The current direction is a private-server, single-user, Notion-like writing system:

- optimized for one person using multiple devices
- lightweight sync through central backend
- independent frontends over a shared backend
- Markdown-first, fast, portable content
- not designed yet for multi-user concurrent editing

Near-term improvements that fit this direction:

- simple but safer CMS auth
- autosave polish
- conflict UX polish
- image management and cleanup
- import/export for Markdown notes
- backup/restore scripts
- optional passcode-friendly mobile login

## Server Runtime Note

The production backend service now runs through `n` managed Node 20:

- Node manager: `n`
- Node binary: `/usr/local/bin/node`
- Node version: `v20.20.2`
- npm version: `10.8.2`
- systemd service: `/etc/systemd/system/veldr-backend.service`
- `ExecStart=/usr/local/bin/node server.js`

The local systemd template was updated accordingly:

- `deploy/systemd/veldr-backend.service`
