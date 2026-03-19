import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'node:http';
import passport from 'passport';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import './db/database.js';
import './db/seed.js';
import { authRouter } from './modules/auth.js';
import { contentRouter } from './modules/content.js';
import { progressRouter } from './modules/progress.js';
import { profileRouter } from './modules/profile.js';
import { chatRouter } from './modules/chat.js';
import { challengeRouter } from './modules/challenges.js';
import { supportRouter } from './modules/support.js';
import { codeRouter } from './modules/code.js';
import { settingsRouter } from './modules/settings.js';
import { computePrimaryRank } from './utils/ranks.js';
import { db } from './db/database.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: env.FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'TryCodeMe API' });
});

app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
app.use('/api/progress', progressRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/chat', chatRouter);
app.use('/api/challenges', challengeRouter);
app.use('/api/support', supportRouter);
app.use('/api/code', codeRouter);
app.use('/api/settings', settingsRouter);

const onlineUsers = new Map<string, { userId: number; nickname: string; avatarUrl: string; role: string; rank: string }>();
let messages: Array<{ id: string; text: string; userId: number; nickname: string; avatarUrl: string; role: string; rank: string; createdAt: string }> = [];

io.on('connection', (socket) => {
  socket.on('chat:join', ({ userId }) => {
    const user = db.prepare('SELECT id, nickname, display_name, avatar_url, role, active_hours, lessons_completed, exercises_completed FROM users WHERE id = ?').get(userId) as any;
    if (!user) return;
    const rank = computePrimaryRank(user);
    onlineUsers.set(socket.id, {
      userId: user.id,
      nickname: user.nickname || user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      rank
    });
    io.emit('chat:presence', Array.from(onlineUsers.values()));
    socket.emit('chat:history', messages.slice(-50));
  });

  socket.on('chat:message', ({ text }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender || typeof text !== 'string' || text.trim().length === 0) return;
    const message = {
      id: crypto.randomUUID(),
      text: text.trim().slice(0, 500),
      userId: sender.userId,
      nickname: sender.nickname,
      avatarUrl: sender.avatarUrl,
      role: sender.role,
      rank: sender.rank,
      createdAt: new Date().toISOString()
    };
    messages.push(message);
    messages = messages.slice(-100);
    io.emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('chat:presence', Array.from(onlineUsers.values()));
  });
});

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`TryCodeMe backend running on port ${env.PORT}`);
});