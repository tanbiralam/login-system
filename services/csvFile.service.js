import { CsvFile } from "../models/csvModels/index.js";
import { enqueueFileProcessing } from "../queues/fileProcessing.queue.js";

export const createCsvFileEntry = async ({
  originalName,
  storedPath,
  mimeType,
  sizeBytes,
}) => {
  const record = await CsvFile.create({
    originalName,
    storedPath,
    mimeType,
    sizeBytes,
  });

  await enqueueFileProcessing(record.id, storedPath); //here the async function is called to enqueue the file for processing

  return {
    id: record.id,
    status: record.status,
    uploadedAt: record.uploadedAt,
  };
};

export const getCsvStatus = async (fileId) => {
  return CsvFile.findByPk(fileId, {
    attributes: [
      "id",
      "status",
      "totalRows",
      "validRows",
      "invalidRows",
      "webhookStatus",
      "webhookAttempts",
      "lastWebhookError",
      "uploadedAt",
      "completedAt",
      "nextWebhookAt",
      "originalName",
      "sizeBytes",
    ],
  });
};
