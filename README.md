# Todo API (backend)

Express + TypeScript REST API backed by PostgreSQL.

## Setup

1. Create a PostgreSQL database: a local one (e.g. `createdb todos`) or a hosted one such as [Supabase](https://supabase.com).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (never commit `.env`).

   **Using Supabase:** in the dashboard click **Connect** and copy the **Session pooler** connection string (the direct `db.<ref>.supabase.co` host is IPv6-only and fails on many networks). Then set:

   ```env
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   DATABASE_SSL=true
   ```

   The frontend still talks only to this Express API, never to Supabase directly.
3. Install, create the table, and start:

```bash
npm install
npm run db:init   # applies schema.sql
npm run dev       # http://localhost:3000
```

Production: `npm run build && npm start`.

Environment variables: `PORT`, `DATABASE_URL`, `CORS_ORIGIN` (comma-separated frontend origins), `DATABASE_SSL` (`true` for hosted DBs that need SSL).

## API

Base URL: `http://localhost:3000/api/todos`. Errors use `{ "error": "message" }`.

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/todos` | 200, array (newest first) | |
| GET | `/api/todos/:id` | 200 | 400 bad id, 404 |
| POST | `/api/todos` `{ "title": "..." }` | 201 | 400 blank/too long title |
| PUT | `/api/todos/:id` | 200 | 400, 404 |
| DELETE | `/api/todos/:id` | 204 | 404 |

`PUT` accepts **partial updates**: send `title`, `completed`, or both (at least one).

## Testing

Import `postman/todo-api.postman_collection.json` into Postman and run the collection (set `baseUrl` if needed). It covers create, validation errors, get, 404, update, delete.
