import { createCsvFileEntry, getCsvStatus } from "../services/csvFile.service.js";

export const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, mimetype, size, path: storedPath } = req.file;

    const record = await createCsvFileEntry({
      originalName: originalname,
      storedPath,
      mimeType: mimetype,
      sizeBytes: size,
    });

    return res.status(202).json({
      success: true,
      fileId: record.id,
      status: record.status,
      uploadedAt: record.uploadedAt,
    });
  } catch (err) {
    next(err);
  }
};

export const getCsvStatusController = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const record = await getCsvStatus(fileId);

    if (!record) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};
