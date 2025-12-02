import { config } from "dotenv";

config();

export const { PORT, NODE_ENV, PG_URI, JWT_SECRET, JWT_EXPIRES_IN } =
  process.env;
