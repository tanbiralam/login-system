import { PdfDocument } from "../models/pdfDocument.model.js";
import { PdfParsedData } from "../models/pdfParsedData.model.js";
import { enqueuePdfProcessing } from "../queues/pdfProcessing.queue.js";

/**
 * POST /api/pdf/upload
 */
export const uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No PDF file uploaded" });
    }

    const { originalname, mimetype, size, path: storedPath } = req.file;

    const pdf = await PdfDocument.create({
      originalName: originalname,
      storedPath,
      mimeType: mimetype,
      sizeBytes: size,
      status: "PENDING",
    });

    await enqueuePdfProcessing(pdf.id, storedPath);

    return res.status(202).json({
      success: true,
      pdfId: pdf.id,
      status: pdf.status,
      uploadedAt: pdf.uploadedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pdf/status/:pdfId
 */
export const getPdfStatus = async (req, res, next) => {
  try {
    const { pdfId } = req.params;

    const pdf = await PdfDocument.findByPk(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "PDF not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: pdf.id,
        status: pdf.status,
        uploadedAt: pdf.uploadedAt,
        completedAt: pdf.completedAt,
        errorReason: pdf.errorReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pdf/result/:pdfId
 * Returns extracted plain text
 */
export const getPdfResult = async (req, res, next) => {
  try {
    const { pdfId } = req.params;

    const pdf = await PdfDocument.findByPk(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "PDF not found",
      });
    }

    if (pdf.status !== "COMPLETED") {
      return res.status(409).json({
        success: false,
        message: "PDF processing not completed",
        status: pdf.status,
      });
    }

    const parsed = await PdfParsedData.findOne({
      where: { pdfId },
    });

    if (!parsed) {
      return res.status(404).json({
        success: false,
        message: "Parsed data not found",
      });
    }

    return res.json({
      success: true,
      data: {
        pdfId,
        pageCount: parsed.pageCount,
        text: parsed.parsedText,
      },
    });
  } catch (error) {
    next(error);
  }
};
