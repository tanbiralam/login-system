import fs from "fs";
import csv from "csv-parser";
import { buildWorker } from "../queues/queue.config.js";
import { FILE_PROCESSING_QUEUE } from "../queues/fileProcessing.queue.js";
import { enqueueWebhook } from "../queues/webhook.queue.js";
import {
  CsvFile,
  ValidRecord,
  InvalidRecord,
} from "../models/csvModels/index.js";

console.log("[CSV][WORKER] fileProcessor worker initialized");

const BATCH_SIZE = 500;

const validateRow = (row) => {
  const email = String(row.email || "").trim();
  const ageRaw = Number(row.age);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, reason: "Invalid email format" };
  }

  if (Number.isNaN(ageRaw) || ageRaw <= 0) {
    return { valid: false, reason: "Age must be a positive number" };
  }

  return { valid: true, email, age: ageRaw };
};

buildWorker(
  FILE_PROCESSING_QUEUE,
  async (job) => {
    const { fileId, filePath } = job.data;

    console.log("[CSV][WORKER] Job started", {
      fileId,
      filePath,
      queue: FILE_PROCESSING_QUEUE,
      jobId: job.id,
    });

    const fileRecord = await CsvFile.findByPk(fileId);
    if (!fileRecord) {
      throw new Error(`File ${fileId} not found`);
    }

    try {
      await fileRecord.update({ status: "PROCESSING" });

      let totalRows = 0;
      let validRows = 0;
      let invalidRows = 0;

      const validBatch = [];
      const invalidBatch = [];

      const flush = async () => {
        if (validBatch.length) {
          await ValidRecord.bulkCreate(validBatch);
          validBatch.length = 0;
        }
        if (invalidBatch.length) {
          await InvalidRecord.bulkCreate(invalidBatch);
          invalidBatch.length = 0;
        }
      };

      const stream = fs.createReadStream(filePath).pipe(csv());

      await new Promise((resolve, reject) => {
        stream.on("data", async (row) => {
          stream.pause();
          try {
            totalRows += 1;
            const result = validateRow(row);
            if (result.valid) {
              validBatch.push({
                fileId,
                email: result.email,
                age: result.age,
              });
              validRows += 1;
            } else {
              invalidBatch.push({
                fileId,
                rawData: row,
                errorReason: result.reason,
              });
              invalidRows += 1;
            }

            if (validBatch.length + invalidBatch.length >= BATCH_SIZE) {
              await flush();
            }
            stream.resume();
          } catch (err) {
            reject(err);
          }
        });

        stream.on("end", async () => {
          try {
            await flush();
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        stream.on("error", (err) => reject(err));
      });

      await fileRecord.update({
        status: "COMPLETED",
        totalRows,
        validRows,
        invalidRows,
        completedAt: new Date(),
      });

      console.log("[CSV][WORKER] Job completed", {
        fileId,
        totals: { totalRows, validRows, invalidRows },
      });

      await enqueueWebhook(fileId);
      return { totalRows, validRows, invalidRows };
    } catch (error) {
      console.error("[CSV][WORKER] Job failed", {
        fileId,
        error: error.message,
      });
      await fileRecord.update({
        status: "FAILED",
        webhookStatus: "FAILED",
        lastWebhookError: error.message,
      });
      throw error;
    } finally {
      fs.unlink(filePath, () => {});
    }
  },
  { concurrency: 2 }
);
