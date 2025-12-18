import { PdfDocument } from "../models/pdfDocument.model.js";
import { PdfParsedData } from "../models/pdfParsedData.model.js";
import { enqueuePdfProcessing } from "../queues/pdfProcessing.queue.js";
import { BalanceSheet } from "../models/financial/balanceSheet.model.js";
import { Engagement } from "../models/financial/engagement.model.js";
import { Company } from "../models/financial/company.model.js";
import { BalanceSheetItem } from "../models/financial/balanceSheetItem.model.js";
import { Category } from "../models/financial/category.model.js";
import { CategoryItem } from "../models/financial/categoryItem.model.js";

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

/**
 * GET /api/pdf/financial/:pdfId
 * Returns structured balance sheet data derived from the PDF
 */
export const getPdfFinancial = async (req, res, next) => {
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

    const balanceSheet = await BalanceSheet.findOne({
      where: { pdfId },
      include: [
        {
          model: Engagement,
          include: [{ model: Company }],
        },
        {
          model: BalanceSheetItem,
          include: [Category, CategoryItem],
        },
      ],
    });

    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: "Balance sheet data not found for this PDF",
      });
    }

    const grouped = balanceSheet.BalanceSheetItems.reduce((acc, item) => {
      const categoryName = item.Category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push({
        id: item.id,
        name: item.CategoryItem?.name,
        amount: item.amount,
      });
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        pdfId,
        company: balanceSheet.Engagement?.Company,
        engagement: balanceSheet.Engagement,
        totals: {
          assets: balanceSheet.totalAssetAmount,
          liabilities: balanceSheet.totalLiabilityAmount,
        },
        categories: grouped,
      },
    });
  } catch (error) {
    next(error);
  }
};
