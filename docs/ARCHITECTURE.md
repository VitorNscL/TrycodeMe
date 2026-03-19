# TryCodeMe Architecture

## Frontend
- React + Vite + TypeScript
- Sidebar with open/close interaction
- Dark/Light theme toggle using CSS variables
- Router-based page separation
- Auth context with token persistence
- Chat via Socket.IO

## Backend
- Express + TypeScript
- SQLite for local persistence
- JWT auth
- Optional Google OAuth scaffold
- Helmet, CORS, rate limit
- Content, profile, progress, support, competitions and code routes
- Socket.IO presence and public chat

## Security notes
- JWT auth and role checks
- Validation via Zod
- Helmet headers enabled
- Rate limiting enabled
- SQLite chosen for easy local setup; can migrate to Postgres later
- Local code runner limited to JavaScript demo use only
