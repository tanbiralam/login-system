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

const BATCH_SIZE = 1000; // increased batch size from 500 to 1000 for better throughput

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
      jobId: job.id,
    });

    const fileRecord = await CsvFile.findByPk(fileId);
    if (!fileRecord) {
      throw new Error(`File ${fileId} not found`);
    }

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;

    const validBatch = [];
    const invalidBatch = [];

    /*** This helps to write valid and invalid rows in parallel which clears the array without reallocating memory again and again    ***/

    const flush = async () => {
      if (!validBatch.length && !invalidBatch.length) return;

      await Promise.all([
        validBatch.length &&
          ValidRecord.bulkCreate(validBatch, { validate: false }),
        invalidBatch.length &&
          InvalidRecord.bulkCreate(invalidBatch, { validate: false }),
      ]);

      validBatch.length = 0;
      invalidBatch.length = 0;
    };

    try {
      await CsvFile.update({ status: "PROCESSING" }, { where: { id: fileId } }); //here updating the status to processing which prevents double processing

      const stream = fs.createReadStream(filePath).pipe(csv());

      // Async iterator ensures proper backpressure handling, preventing memory overload
      for await (const row of stream) {
        totalRows++;

        const result = validateRow(row);

        if (result.valid) {
          validBatch.push({
            fileId,
            email: result.email,
            age: result.age,
          });
          validRows++;
        } else {
          invalidBatch.push({
            fileId,
            // store only required fields to reduce JSONB overhead
            rawData: {
              email: row.email,
              age: row.age,
            },
            // rawData:{row} store entire row for debugging
            errorReason: result.reason,
          });
          invalidRows++;
        }

        if (validBatch.length + invalidBatch.length >= BATCH_SIZE) {
          await flush();
        }
      }

      await flush();

      await CsvFile.update(
        {
          status: "COMPLETED",
          totalRows,
          validRows,
          invalidRows,
          completedAt: new Date(),
        },
        { where: { id: fileId } }
      );

      console.log("[CSV][WORKER] Job completed", {
        fileId,
        totalRows,
        validRows,
        invalidRows,
      });

      await enqueueWebhook(fileId);

      return { totalRows, validRows, invalidRows };
    } catch (error) {
      console.error("[CSV][WORKER] Job failed", {
        fileId,
        error: error.message,
      });

      await CsvFile.update(
        {
          status: "FAILED",
          webhookStatus: "FAILED",
          lastWebhookError: error.message,
        },
        { where: { id: fileId } }
      );

      throw error;
    } finally {
      // async-safe cleanup
      await fs.promises.unlink(filePath).catch((err) => {
        console.warn("[CSV][CLEANUP] Failed to delete file", {
          filePath,
          error: err.message,
        });
      });
    }
  },
  {
    concurrency: 2, // intentionally low to protect DB
  }
);
