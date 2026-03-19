import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/auth/google/callback',
  DB_PATH: process.env.DB_PATH ?? 'trycodeme.db'
};
