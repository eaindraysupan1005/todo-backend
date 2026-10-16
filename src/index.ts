import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { pool } from "./db";

const app = express();
const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const parseId = (raw: string): number => {
  if (!/^\d+$/.test(raw) || Number(raw) > 2147483647) throw new HttpError(400, "Invalid todo id");
  return Number(raw);
};

const parseTitle = (value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "Title is required and cannot be blank");
  }
  const title = value.trim();
  if (title.length > 255) throw new HttpError(400, "Title must be 255 characters or fewer");
  return title;
};

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const COLS = "id, title, completed, created_at";

app.get("/api/todos", wrap(async (_req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM todos ORDER BY created_at DESC, id DESC`);
  res.json(rows);
}));

app.get("/api/todos/:id", wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM todos WHERE id = $1`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Todo not found");
  res.json(rows[0]);
}));

app.post("/api/todos", wrap(async (req, res) => {
  const title = parseTitle(req.body?.title);
  const { rows } = await pool.query(`INSERT INTO todos (title) VALUES ($1) RETURNING ${COLS}`, [title]);
  res.status(201).json(rows[0]);
}));

// PUT accepts partial updates: send `title`, `completed`, or both (at least one required).
app.put("/api/todos/:id", wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { title, completed } = req.body ?? {};
  if (title === undefined && completed === undefined) throw new HttpError(400, "Provide title and/or completed");
  const newTitle = title === undefined ? null : parseTitle(title);
  if (completed !== undefined && typeof completed !== "boolean") {
    throw new HttpError(400, "completed must be a boolean");
  }
  const { rows } = await pool.query(
    `UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING ${COLS}`,
    [newTitle, completed ?? null, id]
  );
  if (!rows[0]) throw new HttpError(404, "Todo not found");
  res.json(rows[0]);
}));

app.delete("/api/todos/:id", wrap(async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [parseId(req.params.id)]);
  if (!rowCount) throw new HttpError(404, "Todo not found");
  res.status(204).end();
}));

app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.parse.failed") return void res.status(400).json({ error: "Invalid JSON body" });
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
