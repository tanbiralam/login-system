import { buildQueue } from "./queue.config.js";

export const PDF_PROCESSING_QUEUE = "pdf-processing";

export const pdfProcessingQueue = buildQueue(PDF_PROCESSING_QUEUE);

export const enqueuePdfProcessing = async (pdfId, pdfPath) => {
  await pdfProcessingQueue.add(
    "process-pdf",
    { pdfId, pdfPath },
    {
      attempts: 3,
      backoff: {
        type: "fixed",
        delay: 60_000, // 1 minute
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log("[PDF][QUEUE] Added job", {
    queue: PDF_PROCESSING_QUEUE,
    pdfId,
    pdfPath,
  });
};
