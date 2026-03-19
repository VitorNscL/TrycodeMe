import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const settingsRouter = Router();

const publicKeys = [
  'home_background_url',
  'community_registered_count',
  'community_headline',
  'community_subtitle',
  'donation_qr_url',
  'donation_goals_text'
] as const;

const settingsSchema = z.object({
  homeBackgroundUrl: z.string().min(1),
  communityRegisteredCount: z.string().min(1).max(30),
  communityHeadline: z.string().min(8).max(180),
  communitySubtitle: z.string().min(12).max(280),
  donationQrUrl: z.string().min(1),
  donationGoalsText: z.string().min(12).max(2000)
});

function readSettings() {
  const rows = db.prepare(`SELECT key, value FROM site_settings WHERE key IN (${publicKeys.map(() => '?').join(', ')})`).all(...publicKeys) as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    homeBackgroundUrl: map.get('home_background_url') || '/site-mark.png',
    communityRegisteredCount: map.get('community_registered_count') || '7.078.794',
    communityHeadline: map.get('community_headline') || 'Conecte-se com devs, estudantes e especialistas que estão evoluindo junto com você.',
    communitySubtitle: map.get('community_subtitle') || 'Comunidade viva com perfis públicos, ranks, desafios e espaço para trocar conhecimento sem poluir a experiência visual.',
    donationQrUrl: map.get('donation_qr_url') || '',
    donationGoalsText: map.get('donation_goals_text') || 'Cada doação ajuda a manter o TryCodeMe no ar, publicar novas trilhas e abrir mais desafios gratuitos para quem está tentando mudar de vida através da tecnologia. Seu apoio fortalece uma comunidade real, acessível e feita para evoluir junto.'
  };
}

settingsRouter.get('/public', (_req, res) => {
  res.json(readSettings());
});

settingsRouter.put('/public', requireAuth, requireRole(['admin']), (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const entries = [
    ['home_background_url', parsed.data.homeBackgroundUrl],
    ['community_registered_count', parsed.data.communityRegisteredCount],
    ['community_headline', parsed.data.communityHeadline],
    ['community_subtitle', parsed.data.communitySubtitle],
    ['donation_qr_url', parsed.data.donationQrUrl],
    ['donation_goals_text', parsed.data.donationGoalsText]
  ] as const;

  const upsert = db.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`);

  const transaction = db.transaction((items: ReadonlyArray<readonly [string, string]>) => {
    for (const [key, value] of items) upsert.run(key, value);
  });

  transaction(entries);
  res.json(readSettings());
});
