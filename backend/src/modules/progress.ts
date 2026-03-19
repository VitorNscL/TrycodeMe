import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

export const progressRouter = Router();

progressRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(req.user.id);
  res.json(rows);
});

progressRouter.post('/', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    lessonId: z.number(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
    progressPercent: z.number().min(0).max(100)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const existing = db.prepare('SELECT id, status FROM progress WHERE user_id = ? AND lesson_id = ?').get(req.user.id, parsed.data.lessonId) as any;

  if (existing) {
    db.prepare(`UPDATE progress SET status = ?, progress_percent = ?, last_accessed_at = CURRENT_TIMESTAMP,
      completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE user_id = ? AND lesson_id = ?`)
      .run(parsed.data.status, parsed.data.progressPercent, parsed.data.status, req.user.id, parsed.data.lessonId);
  } else {
    db.prepare(`INSERT INTO progress (user_id, lesson_id, status, progress_percent, started_at, last_accessed_at, completed_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)`)
      .run(req.user.id, parsed.data.lessonId, parsed.data.status, parsed.data.progressPercent, parsed.data.status);
  }

  if (parsed.data.status === 'completed' && existing?.status !== 'completed') {
    db.prepare('UPDATE users SET lessons_completed = lessons_completed + 1 WHERE id = ?').run(req.user.id);
  }

  res.json({ ok: true });
});

progressRouter.post('/heartbeat', requireAuth, (req: AuthRequest, res) => {
  const current = db.prepare('SELECT active_minutes, last_active_ping FROM users WHERE id = ?').get(req.user.id) as any;
  const now = Date.now();
  const last = current?.last_active_ping ? Date.parse(current.last_active_ping) : 0;
  const minutesSinceLast = last ? Math.floor((now - last) / 60000) : 5;
  const minutesToAdd = Math.max(0, Math.min(10, minutesSinceLast || 5));
  if (minutesToAdd >= 5) {
    db.prepare(`UPDATE users
      SET active_minutes = COALESCE(active_minutes, 0) + ?,
          active_hours = CAST((COALESCE(active_minutes, 0) + ?) / 60 AS INTEGER),
          last_active_ping = CURRENT_TIMESTAMP
      WHERE id = ?`).run(minutesToAdd, minutesToAdd, req.user.id);
  } else {
    db.prepare('UPDATE users SET last_active_ping = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
  }
  const updated = db.prepare('SELECT active_hours, active_minutes FROM users WHERE id = ?').get(req.user.id) as any;
  res.json({ ok: true, active_hours: updated.active_hours, active_minutes: updated.active_minutes });
});
