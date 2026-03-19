import { Router } from 'express';
import { db } from '../db/database.js';
import { computePrimaryRank } from '../utils/ranks.js';

export const profileRouter = Router();

function safeJsonArray(value: unknown) {
  try {
    return value ? JSON.parse(String(value)) : [];
  } catch {
    return [];
  }
}

profileRouter.get('/users/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, display_name, nickname, bio, avatar_url, role, specialty, certifications, active_hours, lessons_completed, exercises_completed, wins, losses, created_at FROM users WHERE id = ?'
  ).get(req.params.id) as any;

  if (!user) {
    return res.status(404).json({ message: 'Perfil não encontrado.' });
  }

  const lessons = db.prepare(
    "SELECT id, title, slug, language, category, difficulty, type FROM lessons WHERE author_id = ? AND status = 'published' ORDER BY updated_at DESC"
  ).all(req.params.id);

  const duelStats = {
    wins: Number(user.wins || 0),
    losses: Number(user.losses || 0),
    total: Number(user.wins || 0) + Number(user.losses || 0)
  };

  res.json({
    ...user,
    certifications: safeJsonArray(user.certifications),
    rank: computePrimaryRank(user),
    competitive_rank: duelStats.wins >= 15 ? 'Elite Competitiva' : duelStats.wins >= 8 ? 'Desafiante' : duelStats.wins >= 3 ? 'Competidor Iniciante' : 'Sem histórico',
    win_rate: duelStats.total ? Math.round((duelStats.wins / duelStats.total) * 100) : 0,
    lesson_count: lessons.length,
    lessons
  });
});

profileRouter.get('/teachers', (_req, res) => {
  const teachers = db.prepare(
    "SELECT id, display_name, nickname, bio, avatar_url, specialty, certifications, role FROM users WHERE role IN ('teacher', 'admin') ORDER BY display_name ASC"
  ).all();

  res.json(
    (teachers as any[]).map((teacher) => ({
      ...teacher,
      certifications: safeJsonArray(teacher.certifications)
    }))
  );
});
