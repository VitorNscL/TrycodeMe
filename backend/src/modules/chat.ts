import { Router } from 'express';

export const chatRouter = Router();

// Real-time chat is delivered by Socket.IO in server.ts.
// This route exists so the frontend has a simple health endpoint for the chat page.
chatRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});
