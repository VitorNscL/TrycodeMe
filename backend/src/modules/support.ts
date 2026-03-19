import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const supportRouter = Router();

supportRouter.post('/', (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    category: z.string().min(2),
    message: z.string().min(10)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  db.prepare('INSERT INTO support_messages (name, email, category, message) VALUES (?, ?, ?, ?)')
    .run(parsed.data.name, parsed.data.email, parsed.data.category, parsed.data.message);
  res.status(201).json({ ok: true });
});

supportRouter.get('/', requireAuth, requireRole(['admin']), (_req, res) => {
  res.json(db.prepare('SELECT * FROM support_messages ORDER BY created_at DESC').all());
});
