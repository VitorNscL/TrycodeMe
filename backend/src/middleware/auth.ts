import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/security.js';
import { db } from '../db/database.js';

export type AuthRequest = Request & { user?: any };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  try {
    const token = header.replace('Bearer ', '');
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, email, display_name, nickname, bio, avatar_url, role, specialty, certifications, active_hours, lessons_completed, exercises_completed, wins, losses FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ message: 'Usuário inválido.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    next();
  };
}
