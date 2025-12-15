import axios from "axios";
import { buildWorker } from "../queues/queue.config.js";
import { WEBHOOK_QUEUE, enqueueWebhook } from "../queues/webhook.queue.js";
import { CsvFile } from "../models/csvModels/index.js";

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MAX_ATTEMPTS = Number(process.env.WEBHOOK_MAX_ATTEMPTS || 5);
const RETRY_DELAYS = [60_000, 300_000, 1_800_000]; // ms for attempts 2-4+ (reuse last delay)

console.log("[CSV][WEBHOOK] webhook worker initialized");

buildWorker(
  WEBHOOK_QUEUE,
  async (job) => {
    const { fileId, attempt = 1 } = job.data;

    console.log("[CSV][WEBHOOK] Attempt started", {
      fileId,
      attempt,
      jobId: job.id,
    });

    const file = await CsvFile.findByPk(fileId);
    if (!file) throw new Error(`File ${fileId} not found for webhook`);

    if (!WEBHOOK_URL) {
      await file.update({
        webhookStatus: "FAILED",
        webhookAttempts: attempt,
        lastWebhookError: "WEBHOOK_URL not configured",
      });
      return;
    }

    const payload = {
      fileId,
      rowsProcessed: file.totalRows,
      validRows: file.validRows,
      invalidRows: file.invalidRows,
      completedAt: file.completedAt,
    };

    try {
      await axios.post(WEBHOOK_URL, payload, {
        timeout: 10_000,
      });
      await file.update({
        webhookStatus: "SUCCESS",
        webhookAttempts: attempt,
        lastWebhookError: null,
        nextWebhookAt: null,
      });
      console.log("[CSV][WEBHOOK] Attempt success", { fileId, attempt });
    } catch (err) {
      const nextAttempt = attempt + 1;
      const nextDelay =
        RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
      const lastError =
        err.response?.data?.message ||
        err.message ||
        "Unknown webhook error";

      await file.update({
        webhookStatus: nextAttempt > MAX_ATTEMPTS ? "FAILED" : "PENDING",
        webhookAttempts: attempt,
        lastWebhookError: lastError,
        nextWebhookAt:
          nextAttempt > MAX_ATTEMPTS
            ? null
            : new Date(Date.now() + (nextDelay || 0)),
      });

      if (nextAttempt <= MAX_ATTEMPTS) {
        await enqueueWebhook(fileId, nextAttempt, nextDelay || 0);
        console.warn("[CSV][WEBHOOK] Attempt failed, will retry", {
          fileId,
          attempt,
          nextAttempt,
          delayMs: nextDelay,
          error: lastError,
        });
      } else {
        console.error("[CSV][WEBHOOK] Final attempt failed", {
          fileId,
          attempt,
          error: lastError,
        });
        throw new Error(
          `Webhook failed after ${attempt} attempts: ${lastError}`
        );
      }
    }
  },
  { concurrency: 2 }
);
