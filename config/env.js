import { config } from "dotenv";

config();

export const {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  RESEND_API_KEY,
  FRONTEND_URL,
} = process.env;
