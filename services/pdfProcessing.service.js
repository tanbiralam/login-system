import { enqueuePdfProcessing } from "../queues/pdfProcessing.queue.js";

export const startPdfProcessing = async (pdfId, storedPath) => {
  await enqueuePdfProcessing(pdfId, storedPath);
};
