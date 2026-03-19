import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';

const sectionSchema = z.array(z.object({
  kind: z.enum(['text', 'code', 'image', 'gif', 'video', 'command', 'tip', 'alert']),
  title: z.string().default(''),
  content: z.string().default('')
}));

const lessonSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(10),
  learnOutcomes: z.string().min(10),
  language: z.string().min(2),
  category: z.string().min(2),
  difficulty: z.string().min(2),
  type: z.enum(['practical', 'theory', 'cyber', 'quiz', 'competitive']),
  tags: z.array(z.string()),
  keywords: z.array(z.string()),
  featured: z.boolean(),
  status: z.enum(['draft', 'published']),
  authorLabel: z.string().default(''),
  sections: sectionSchema,
  exerciseId: z.number().nullable().optional(),
  authorId: z.number().optional(),
  thumbnailUrl: z.string().default('')
});

const exerciseSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  language: z.string().min(2),
  difficulty: z.string().min(2),
  type: z.enum(['code', 'quiz', 'cyber']),
  prompt: z.string().min(10),
  starterCode: z.string().default(''),
  solution: z.string().default(''),
  testConfig: z.any(),
  featured: z.boolean(),
  thumbnailUrl: z.string().default('')
});

function mapLessonRow(row: any) {
  return { ...row, tags: JSON.parse(row.tags), keywords: JSON.parse(row.keywords) };
}

export const contentRouter = Router();

contentRouter.get('/lessons', (_req, res) => {
  const rows = db.prepare(`SELECT lessons.*, users.display_name, users.nickname, users.avatar_url, users.role, users.specialty
    FROM lessons JOIN users ON users.id = lessons.author_id
    WHERE lessons.status = 'published'
    ORDER BY lessons.featured DESC, lessons.updated_at DESC`).all();
  res.json(rows.map(mapLessonRow));
});

contentRouter.get('/lessons/:slug', (req, res) => {
  const row = db.prepare(`SELECT lessons.*, users.display_name, users.nickname, users.avatar_url, users.role, users.specialty, users.certifications, users.id as authorProfileId
    FROM lessons JOIN users ON users.id = lessons.author_id
    WHERE lessons.slug = ?`).get(req.params.slug) as any;
  if (!row) return res.status(404).json({ message: 'Aula não encontrada.' });
  res.json({
    ...row,
    tags: JSON.parse(row.tags),
    keywords: JSON.parse(row.keywords),
    sections: JSON.parse(row.sections),
    author: {
      id: row.authorProfileId,
      name: row.nickname || row.display_name,
      avatarUrl: row.avatar_url,
      specialty: row.specialty,
      certifications: JSON.parse(row.certifications || '[]'),
      role: row.role
    }
  });
});

contentRouter.get('/exercises', (_req, res) => {
  const rows = db.prepare('SELECT exercises.*, users.nickname, users.display_name FROM exercises JOIN users ON users.id = exercises.author_id ORDER BY featured DESC, updated_at DESC').all();
  res.json(rows.map((row: any) => ({ ...row, test_config: JSON.parse(row.test_config) })));
});

contentRouter.post('/lessons', requireAuth, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const authorId = req.user.role === 'admin' && parsed.data.authorId ? Number(parsed.data.authorId) : req.user.id;
  const result = db.prepare(`INSERT INTO lessons (title, slug, summary, learn_outcomes, language, category, difficulty, type, tags, keywords, featured, status, author_id, author_label, sections, exercise_id, thumbnail_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(
      parsed.data.title,
      parsed.data.slug,
      parsed.data.summary,
      parsed.data.learnOutcomes,
      parsed.data.language,
      parsed.data.category,
      parsed.data.difficulty,
      parsed.data.type,
      JSON.stringify(parsed.data.tags),
      JSON.stringify(parsed.data.keywords),
      parsed.data.featured ? 1 : 0,
      parsed.data.status,
      authorId,
      parsed.data.authorLabel,
      JSON.stringify(parsed.data.sections),
      parsed.data.exerciseId ?? null,
      parsed.data.thumbnailUrl
    );

  res.status(201).json({ id: result.lastInsertRowid });
});

contentRouter.post('/bundles', requireAuth, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const schema = z.object({
    lesson: lessonSchema.optional(),
    exercise: exerciseSchema.optional(),
    mode: z.enum(['lesson', 'exercise', 'lesson_with_exercise'])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  let exerciseId: number | null = null;

  if (parsed.data.mode !== 'lesson') {
    if (!parsed.data.exercise) return res.status(400).json({ message: 'Exercício é obrigatório nesse modo.' });
    const result = db.prepare(`INSERT INTO exercises (title, summary, language, difficulty, type, prompt, starter_code, solution, test_config, featured, author_id, thumbnail_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .run(
        parsed.data.exercise.title,
        parsed.data.exercise.summary,
        parsed.data.exercise.language,
        parsed.data.exercise.difficulty,
        parsed.data.exercise.type,
        parsed.data.exercise.prompt,
        parsed.data.exercise.starterCode,
        parsed.data.exercise.solution,
        JSON.stringify(parsed.data.exercise.testConfig),
        parsed.data.exercise.featured ? 1 : 0,
        req.user.id,
        parsed.data.exercise.thumbnailUrl
      );
    exerciseId = Number(result.lastInsertRowid);
  }

  let lessonId: number | null = null;

  if (parsed.data.mode !== 'exercise') {
    if (!parsed.data.lesson) return res.status(400).json({ message: 'Aula é obrigatória nesse modo.' });
    const authorId = req.user.role === 'admin' && parsed.data.lesson.authorId ? Number(parsed.data.lesson.authorId) : req.user.id;
    const result = db.prepare(`INSERT INTO lessons (title, slug, summary, learn_outcomes, language, category, difficulty, type, tags, keywords, featured, status, author_id, author_label, sections, exercise_id, thumbnail_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .run(
        parsed.data.lesson.title,
        parsed.data.lesson.slug,
        parsed.data.lesson.summary,
        parsed.data.lesson.learnOutcomes,
        parsed.data.lesson.language,
        parsed.data.lesson.category,
        parsed.data.lesson.difficulty,
        parsed.data.lesson.type,
        JSON.stringify(parsed.data.lesson.tags),
        JSON.stringify(parsed.data.lesson.keywords),
        parsed.data.lesson.featured ? 1 : 0,
        parsed.data.lesson.status,
        authorId,
        parsed.data.lesson.authorLabel,
        JSON.stringify(parsed.data.lesson.sections),
        exerciseId,
        parsed.data.lesson.thumbnailUrl
      );
    lessonId = Number(result.lastInsertRowid);
  }

  res.status(201).json({ lessonId, exerciseId });
});

contentRouter.put('/lessons/:id', requireAuth, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const existing = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ message: 'Aula não encontrada.' });
  if (req.user.role !== 'admin' && existing.author_id !== req.user.id) return res.status(403).json({ message: 'Você só pode editar a própria aula.' });

  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  db.prepare(`UPDATE lessons SET title = ?, slug = ?, summary = ?, learn_outcomes = ?, language = ?, category = ?, difficulty = ?, type = ?, tags = ?, keywords = ?, featured = ?, status = ?, author_label = ?, sections = ?, exercise_id = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(
      parsed.data.title,
      parsed.data.slug,
      parsed.data.summary,
      parsed.data.learnOutcomes,
      parsed.data.language,
      parsed.data.category,
      parsed.data.difficulty,
      parsed.data.type,
      JSON.stringify(parsed.data.tags),
      JSON.stringify(parsed.data.keywords),
      parsed.data.featured ? 1 : 0,
      parsed.data.status,
      parsed.data.authorLabel,
      JSON.stringify(parsed.data.sections),
      parsed.data.exerciseId ?? null,
      parsed.data.thumbnailUrl,
      req.params.id
    );
  res.json({ ok: true });
});

contentRouter.delete('/lessons/:id', requireAuth, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const existing = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ message: 'Aula não encontrada.' });
  if (req.user.role !== 'admin' && existing.author_id !== req.user.id) return res.status(403).json({ message: 'Você só pode excluir a própria aula.' });
  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

contentRouter.post('/exercises', requireAuth, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const parsed = exerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const result = db.prepare(`INSERT INTO exercises (title, summary, language, difficulty, type, prompt, starter_code, solution, test_config, featured, author_id, thumbnail_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(
      parsed.data.title,
      parsed.data.summary,
      parsed.data.language,
      parsed.data.difficulty,
      parsed.data.type,
      parsed.data.prompt,
      parsed.data.starterCode,
      parsed.data.solution,
      JSON.stringify(parsed.data.testConfig),
      parsed.data.featured ? 1 : 0,
      req.user.id,
      parsed.data.thumbnailUrl
    );
  res.status(201).json({ id: result.lastInsertRowid });
});
