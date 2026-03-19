import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { runJavaScript } from '../utils/codeRunner.js';

export const challengeRouter = Router();

const duelCreateSchema = z.object({
  opponentId: z.number(),
  difficulty: z.string().min(2),
  mode: z.enum(['code', 'quiz']).default('code'),
  exerciseId: z.number().optional()
});

function serializeCompetition(row: any) {
  return row;
}

function pickExercise(mode: 'code' | 'quiz', difficulty: string) {
  const exact = db.prepare('SELECT * FROM exercises WHERE type = ? AND difficulty = ? ORDER BY featured DESC, RANDOM() LIMIT 1').get(mode, difficulty) as any;
  if (exact) return exact;
  return db.prepare('SELECT * FROM exercises WHERE type = ? ORDER BY featured DESC, RANDOM() LIMIT 1').get(mode) as any;
}

function serializeDuel(row: any) {
  return {
    ...row,
    challenger: row.challenger_id ? {
      id: row.challenger_id,
      nickname: row.challenger_nickname,
      avatar_url: row.challenger_avatar,
      role: row.challenger_role
    } : null,
    opponent: row.opponent_id ? {
      id: row.opponent_id,
      nickname: row.opponent_nickname,
      avatar_url: row.opponent_avatar,
      role: row.opponent_role
    } : null,
    exercise: row.exercise_id ? {
      id: row.exercise_id,
      title: row.exercise_title,
      type: row.exercise_type,
      prompt: row.exercise_prompt,
      starter_code: row.starter_code,
      solution: row.solution,
      language: row.language,
      test_config: JSON.parse(row.test_config || '{}')
    } : null
  };
}

function getDuelById(duelId: string | number) {
  return db.prepare(`SELECT
    d.*,
    c.nickname as challenger_nickname,
    c.display_name as challenger_display_name,
    c.avatar_url as challenger_avatar,
    c.role as challenger_role,
    o.nickname as opponent_nickname,
    o.display_name as opponent_display_name,
    o.avatar_url as opponent_avatar,
    o.role as opponent_role,
    e.title as exercise_title,
    e.type as exercise_type,
    e.prompt as exercise_prompt,
    e.starter_code,
    e.solution,
    e.language,
    e.test_config
  FROM duels d
  JOIN users c ON c.id = d.challenger_id
  JOIN users o ON o.id = d.opponent_id
  JOIN exercises e ON e.id = d.exercise_id
  WHERE d.id = ?`).get(duelId) as any;
}

challengeRouter.get('/competitions', (_req, res) => {
  res.json((db.prepare('SELECT * FROM competitions ORDER BY created_at DESC').all() as any[]).map(serializeCompetition));
});

challengeRouter.post('/competitions', requireAuth, requireRole(['admin']), (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    difficulty: z.string().min(2),
    startsAt: z.string(),
    durationMinutes: z.number().min(5),
    exerciseId: z.number()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const result = db.prepare(`INSERT INTO competitions (title, description, difficulty, starts_at, duration_minutes, exercise_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)`) 
    .run(parsed.data.title, parsed.data.description, parsed.data.difficulty, parsed.data.startsAt, parsed.data.durationMinutes, parsed.data.exerciseId, req.user.id);
  res.status(201).json({ id: result.lastInsertRowid });
});

challengeRouter.patch('/competitions/:id/status', requireAuth, requireRole(['admin']), (req, res) => {
  const schema = z.object({ status: z.enum(['scheduled', 'live', 'suspended', 'finished']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
  db.prepare('UPDATE competitions SET status = ? WHERE id = ?').run(parsed.data.status, String(req.params.id));
  res.json({ ok: true });
});

challengeRouter.delete('/competitions/:id', requireAuth, requireRole(['admin']), (req, res) => {
  db.prepare('DELETE FROM competition_entries WHERE competition_id = ?').run(String(req.params.id));
  db.prepare('DELETE FROM competitions WHERE id = ?').run(String(req.params.id));
  res.json({ ok: true });
});

challengeRouter.post('/duels', requireAuth, (req: AuthRequest, res) => {
  const parsed = duelCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
  if (parsed.data.opponentId === req.user.id) return res.status(400).json({ message: 'Você não pode se desafiar.' });

  const opponent = db.prepare('SELECT id FROM users WHERE id = ?').get(parsed.data.opponentId) as any;
  if (!opponent) return res.status(404).json({ message: 'Oponente não encontrado.' });

  const exercise = parsed.data.exerciseId
    ? db.prepare('SELECT * FROM exercises WHERE id = ?').get(parsed.data.exerciseId)
    : pickExercise(parsed.data.mode, parsed.data.difficulty);

  if (!exercise) return res.status(400).json({ message: 'Nenhum exercício disponível para esse modo.' });

  const result = db.prepare(`INSERT INTO duels (challenger_id, opponent_id, exercise_id, difficulty, mode) VALUES (?, ?, ?, ?, ?)`)
    .run(req.user.id, parsed.data.opponentId, (exercise as any).id, parsed.data.difficulty, parsed.data.mode);
  const duel = getDuelById(result.lastInsertRowid);
  res.status(201).json(serializeDuel(duel));
});

challengeRouter.get('/duels', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare(`SELECT
    d.*,
    c.nickname as challenger_nickname,
    c.avatar_url as challenger_avatar,
    c.role as challenger_role,
    o.nickname as opponent_nickname,
    o.avatar_url as opponent_avatar,
    o.role as opponent_role,
    e.title as exercise_title,
    e.type as exercise_type,
    e.prompt as exercise_prompt,
    e.starter_code,
    e.solution,
    e.language,
    e.test_config
  FROM duels d
  JOIN users c ON c.id = d.challenger_id
  JOIN users o ON o.id = d.opponent_id
  JOIN exercises e ON e.id = d.exercise_id
  WHERE d.challenger_id = ? OR d.opponent_id = ?
  ORDER BY d.created_at DESC`).all(req.user.id, req.user.id) as any[];
  res.json(rows.map(serializeDuel));
});

challengeRouter.get('/duels/pending', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare(`SELECT
    d.*,
    c.nickname as challenger_nickname,
    c.avatar_url as challenger_avatar,
    c.role as challenger_role,
    o.nickname as opponent_nickname,
    o.avatar_url as opponent_avatar,
    o.role as opponent_role,
    e.title as exercise_title,
    e.type as exercise_type,
    e.prompt as exercise_prompt,
    e.starter_code,
    e.solution,
    e.language,
    e.test_config
  FROM duels d
  JOIN users c ON c.id = d.challenger_id
  JOIN users o ON o.id = d.opponent_id
  JOIN exercises e ON e.id = d.exercise_id
  WHERE d.opponent_id = ? AND d.status = 'pending'
  ORDER BY d.created_at DESC`).all(req.user.id) as any[];
  res.json(rows.map(serializeDuel));
});

challengeRouter.post('/duels/:id/accept', requireAuth, (req: AuthRequest, res) => {
  const duel = getDuelById(String(req.params.id));
  if (!duel) return res.status(404).json({ message: 'Duelo não encontrado.' });
  if (duel.opponent_id !== req.user.id) return res.status(403).json({ message: 'Apenas o oponente pode aceitar.' });
  if (duel.status !== 'pending') return res.status(400).json({ message: 'Esse duelo não está pendente.' });
  db.prepare(`UPDATE duels SET status = 'active', started_at = CURRENT_TIMESTAMP WHERE id = ?`).run(String(req.params.id));
  res.json(serializeDuel(getDuelById(String(req.params.id))));
});

challengeRouter.post('/duels/:id/reject', requireAuth, (req: AuthRequest, res) => {
  const duel = getDuelById(String(req.params.id));
  if (!duel) return res.status(404).json({ message: 'Duelo não encontrado.' });
  if (duel.opponent_id !== req.user.id) return res.status(403).json({ message: 'Apenas o oponente pode recusar.' });
  if (duel.status !== 'pending') return res.status(400).json({ message: 'Esse duelo não está pendente.' });
  db.prepare(`UPDATE duels SET status = 'rejected', completed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(String(req.params.id));
  res.json({ ok: true });
});

challengeRouter.get('/duels/:id', requireAuth, (req: AuthRequest, res) => {
  const duel = getDuelById(String(req.params.id));
  if (!duel) return res.status(404).json({ message: 'Duelo não encontrado.' });
  if (duel.challenger_id !== req.user.id && duel.opponent_id !== req.user.id) return res.status(403).json({ message: 'Sem acesso a esse duelo.' });
  res.json(serializeDuel(duel));
});

challengeRouter.post('/duels/:id/submit', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({ source: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const duel = getDuelById(String(req.params.id));
  if (!duel) return res.status(404).json({ message: 'Duelo não encontrado.' });
  if (duel.challenger_id !== req.user.id && duel.opponent_id !== req.user.id) return res.status(403).json({ message: 'Sem acesso a esse duelo.' });
  if (duel.status !== 'active') return res.status(400).json({ message: 'Esse duelo ainda não está ativo.' });

  let passed = false;
  let feedback = '';

  if (duel.exercise_type === 'quiz') {
    const config = JSON.parse(duel.test_config || '{}');
    passed = String(parsed.data.source).trim().toUpperCase() === String(config.correctOption || '').trim().toUpperCase();
    feedback = passed ? 'Resposta correta.' : 'Resposta incorreta. Revise o enunciado e tente novamente.';
  } else {
    try {
      const normalizedSource = parsed.data.source.replace(/\s+/g, '');
      const normalizedSolution = String(duel.solution || '').replace(/\s+/g, '');
      if (normalizedSource === normalizedSolution) {
        passed = true;
        feedback = 'Solução correta.';
      } else {
        runJavaScript(parsed.data.source);
        feedback = 'Executou, mas ainda não bate com a solução esperada.';
      }
    } catch (error: any) {
      feedback = error?.message || 'Seu código falhou ao executar.';
    }
  }

  if (!passed) {
    return res.json({ passed: false, feedback });
  }

  const loserId = duel.challenger_id === req.user.id ? duel.opponent_id : duel.challenger_id;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE duels SET status = 'finished', winner_id = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.user.id, String(req.params.id));
    db.prepare('UPDATE users SET wins = wins + 1 WHERE id = ?').run(req.user.id);
    db.prepare('UPDATE users SET losses = losses + 1 WHERE id = ?').run(loserId);
    db.prepare('UPDATE users SET exercises_completed = exercises_completed + 1 WHERE id = ?').run(req.user.id);
  });
  tx();

  res.json({ passed: true, feedback: 'Você venceu o duelo!', duel: serializeDuel(getDuelById(String(req.params.id))) });
});
