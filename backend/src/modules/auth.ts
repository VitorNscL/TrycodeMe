import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { signToken } from '../utils/security.js';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth.js';
import { computePrimaryRank } from '../utils/ranks.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const roleUpdateSchema = z.object({
  role: z.enum(['user', 'teacher', 'admin'])
});

function normalizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    nickname: user.nickname,
    bio: user.bio,
    avatar_url: user.avatar_url,
    role: user.role,
    specialty: user.specialty,
    certifications: user.certifications,
    active_hours: user.active_hours,
    lessons_completed: user.lessons_completed,
    exercises_completed: user.exercises_completed,
    wins: user.wins,
    losses: user.losses,
    rank: computePrimaryRank(user)
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL
  }, (_accessToken, _refreshToken, profile, done) => {
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(profile.emails?.[0]?.value);
    if (!user) {
      const info = db.prepare(`INSERT INTO users (email, display_name, nickname, avatar_url, provider)
        VALUES (?, ?, ?, ?, 'google')`).run(
        profile.emails?.[0]?.value,
        profile.displayName,
        profile.displayName,
        profile.photos?.[0]?.value ?? ''
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    }
    done(null, user);
  }));
}

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: number, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || false);
});

export const authRouter = Router();

authRouter.get('/config', (_req, res) => {
  res.json({ googleEnabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) });
});

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email);
  if (existing) return res.status(409).json({ message: 'Email já cadastrado.' });

  const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
  const result = db.prepare(`INSERT INTO users (email, password_hash, display_name, nickname) VALUES (?, ?, ?, ?)`)
    .run(parsed.data.email, passwordHash, parsed.data.displayName, parsed.data.displayName);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: normalizeUser(user) });
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email) as any;
  if (!user || !user.password_hash || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: normalizeUser(user) });
});

authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: normalizeUser(req.user) });
});

authRouter.put('/me', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    nickname: z.string().min(2).max(30),
    bio: z.string().max(240),
    avatarUrl: z.string().url().or(z.literal('')),
    specialty: z.string().max(120),
    certifications: z.array(z.string()).max(10)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  db.prepare(`UPDATE users SET nickname = ?, bio = ?, avatar_url = ?, specialty = ?, certifications = ? WHERE id = ?`)
    .run(parsed.data.nickname, parsed.data.bio, parsed.data.avatarUrl, parsed.data.specialty, JSON.stringify(parsed.data.certifications), req.user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as any;
  res.json({ user: normalizeUser(updated) });
});

authRouter.get('/users', requireAuth, requireRole(['admin']), (_req, res) => {
  const rows = db.prepare(`SELECT id, email, display_name, nickname, avatar_url, role, specialty, lessons_completed, exercises_completed, active_hours, wins, losses, created_at FROM users ORDER BY created_at DESC`).all();
  res.json((rows as any[]).map(normalizeUser));
});


authRouter.get('/directory', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare(`SELECT id, email, display_name, nickname, avatar_url, role, specialty, certifications, active_hours, lessons_completed, exercises_completed, wins, losses FROM users WHERE id != ? ORDER BY nickname ASC`).all(req.user.id);
  res.json((rows as any[]).map(normalizeUser));
});

authRouter.patch('/users/:id/role', requireAuth, requireRole(['admin']), (req, res) => {
  const parsed = roleUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado.' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(parsed.data.role, req.params.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  res.json({ user: normalizeUser(updated) });
});

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  authRouter.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=google` }), (req: any, res) => {
    const token = signToken({ userId: req.user.id, role: req.user.role });
    res.redirect(`${env.FRONTEND_URL}/login?token=${token}`);
  });
}
