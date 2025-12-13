import bullmq from "bullmq";
import IORedis from "ioredis";

const { Queue, Worker } = bullmq;

const rawUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const hasScheme = rawUrl.startsWith("redis://") || rawUrl.startsWith("rediss://");
const REDIS_URL = hasScheme ? rawUrl : `redis://${rawUrl}`;

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (process.env.REDIS_PASSWORD && !REDIS_URL.includes("@")) {
  redisOptions.password = process.env.REDIS_PASSWORD;
}

export const connection = new IORedis(REDIS_URL, redisOptions);

export const buildQueue = (name) => new Queue(name, { connection });
export const buildWorker = (name, processor, opts = {}) =>
  new Worker(name, processor, { connection, ...opts });
