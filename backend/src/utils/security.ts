import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: number; role: string };
}
