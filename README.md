# Veldr

Veldr is a personal note writing system with a Vue/Vite frontend and an Express + SQLite backend.

This repository has been reorganized as a full-stack project. It is intended for private writing, image-heavy notes, drafts, and personal article management.

## Current Positioning

- Use Veldr for personal notes and longer writing.
- New articles default to private.
- Chinese titles are supported without requiring a URL slug.
- `Slug` is optional. Leave it empty for personal notes; use it only when an English URL identifier is useful.
- Uploaded images and SQLite runtime data stay local and are ignored by Git.

## Project Structure

```text
veldr/
├─ backend/              # Express API, SQLite data, uploads, cleanup scripts
├─ frontend/             # Vue 3 + Vite admin and reader UI
├─ public/               # Legacy/static assets kept from the original project
├─ .gitignore
└─ README.md
```

## Local Development

Start the backend:

```bash
cd backend
npm install
npm start
```

Backend default URL:

```text
http://127.0.0.1:5000/api
http://127.0.0.1:5000/api/health
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

## Environment

Backend:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | Backend listening port |
| `DB_DIALECT` | `sqlite` | Database dialect |
| `DB_STORAGE` | `public/data/cms.sqlite` | Main SQLite database |
| `DB_LOGGING` | `false` | Sequelize query logging |
| `DEFAULT_PASSWORD` | `123456` | Initial password value when no security DB exists |

Frontend:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_FRONTEND_PORT` | `5173` | Vite dev server port |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | API base URL |
| `VITE_UPLOAD_BASE_URL` | `http://localhost:5000/uploads` | Upload file base URL |

## Password Notes

Do not commit real local passwords. Runtime password data is stored in:

```text
backend/public/data/security.sqlite
```

The checked-in README documents how the password system works, but not any private local password currently in use.

## Data And Cleanup

Runtime files are intentionally ignored by Git:

- `backend/public/data/*.sqlite`
- `backend/public/uploads/`
- `backend/public/backups/`
- `backend/temp/`

To preview unused image cleanup:

```bash
cd backend
node scripts/cleanup-unused-images.js
```

To delete unused images with a backup:

```bash
cd backend
node scripts/cleanup-unused-images.js --delete
```

## Verification

Useful checks before pushing:

```bash
cd frontend
npm run build

cd ../backend
node --input-type=module -e "import Article from './models/Article.js'; const a = Article.build({ title: '中文个人笔记', content: 'test' }); await a.validate(); console.log(a.slug ?? null); await Article.sequelize.close();"
```

## Git Remote

```text
origin: https://github.com/lieshy521-9577/veldr.git
```
