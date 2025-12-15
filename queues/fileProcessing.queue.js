import { buildQueue } from "./queue.config.js";

export const FILE_PROCESSING_QUEUE = "csv-file-processing";

export const fileProcessingQueue = buildQueue(FILE_PROCESSING_QUEUE);

export const enqueueFileProcessing = async (fileId, filePath) => {
  await fileProcessingQueue.add("process-file", { fileId, filePath });
  console.log("[CSV][QUEUE] Added job", {
    queue: FILE_PROCESSING_QUEUE,
    fileId,
    filePath,
  });
};
