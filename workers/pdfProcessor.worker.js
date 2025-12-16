import fs from "fs";
import pdfParse from "pdf-parse";

import { buildWorker } from "../queues/queue.config.js";
import { PDF_PROCESSING_QUEUE } from "../queues/pdfProcessing.queue.js";

import { PdfDocument } from "../models/pdfDocument.model.js";
import { PdfParsedData } from "../models/pdfParsedData.model.js";

console.log("[PDF][WORKER] Starting PDF processing worker...");

buildWorker(
  PDF_PROCESSING_QUEUE,
  async (job) => {
    const { pdfId, pdfPath } = job.data;

    console.log("[PDF][WORKER] Processing PDF", { pdfId, jobId: job.id });

    const pdf = await PdfDocument.findByPk(pdfId);

    if (!pdf) {
      throw new Error(`PDF document with ID ${pdfId} not found`);
    }

    // Idempotency / state guard
    if (pdf.status !== "PENDING") {
      console.log("[PDF][WORKER] Skipping PDF (invalid state)", {
        pdfId,
        status: pdf.status,
      });
      return;
    }

    try {
      await PdfDocument.update(
        { status: "PROCESSING" },
        { where: { id: pdfId } }
      );

      const fileBuffer = await fs.promises.readFile(pdfPath);
      const parsed = await pdfParse(fileBuffer);

      await PdfParsedData.create({
        pdfId,
        parsedText: parsed.text,
        pageCount: parsed.numpages,
      });

      await PdfDocument.update(
        {
          status: "COMPLETED",
          completedAt: new Date(),
          errorReason: null,
        },
        { where: { id: pdfId } }
      );

      console.log("[PDF][WORKER] Completed PDF processing", {
        pdfId,
        pages: parsed.numpages,
      });
    } catch (error) {
      console.error("[PDF][WORKER] Error processing PDF", {
        pdfId,
        error: error.message,
      });

      await PdfDocument.update(
        { status: "FAILED", errorReason: error.message },
        { where: { id: pdfId } }
      );

      throw error;
    } finally {
      // cleanup temp file
      await fs.promises.unlink(pdfPath).catch((err) => {
        console.warn("[PDF][WORKER] Failed to delete temp file", {
          pdfPath,
          error: err.message,
        });
      });
    }
  },
  {
    concurrency: 1,
  }
);
