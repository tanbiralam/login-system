import { buildQueue } from "./queue.config.js";

export const WEBHOOK_QUEUE = "csv-webhook";

export const webhookQueue = buildQueue(WEBHOOK_QUEUE);

export const enqueueWebhook = async (fileId, attempt = 1, delay = 0) => {
  await webhookQueue.add(
    "send-webhook",
    { fileId, attempt },
    { delay, removeOnComplete: true, removeOnFail: false }
  );
};
