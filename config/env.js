import { config } from "dotenv";

config();

export const {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  REDIS_URL,
  WEBHOOK_URL,
  WEBHOOK_MAX_ATTEMPTS,
} = process.env;
