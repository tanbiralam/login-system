import fs from "fs";
import path from "path";

import { PdfDocument } from "../models/pdfDocument.model.js";
import { PdfParsedData } from "../models/pdfParsedData.model.js";
import { enqueuePdfProcessing } from "../queues/pdfProcessing.queue.js";
import { BalanceSheet } from "../models/financial/balanceSheet.model.js";
import { Engagement } from "../models/financial/engagement.model.js";
import { Company } from "../models/financial/company.model.js";
import { BalanceSheetItem } from "../models/financial/balanceSheetItem.model.js";
import { Category } from "../models/financial/category.model.js";
import { CategoryItem } from "../models/financial/categoryItem.model.js";
import { sequelize } from "../database/sequelize.js";
import { generateAnnotatedPdf } from "../services/pdfAnnotation.service.js";

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeLineItems = (items) =>
  Array.isArray(items)
    ? items
        .map((item) => {
          const name = String(item?.name || "").trim();
          if (!name) return null;
          return {
            name,
            amount: Number(toNumber(item?.amount).toFixed(2)),
          };
        })
        .filter(Boolean)
    : [];

const buildFinancialPayload = (balanceSheet) => {
  if (!balanceSheet) return null;

  const items = balanceSheet.BalanceSheetItems || [];

  const grouped = items.reduce((acc, item) => {
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

  return {
    pdfId: balanceSheet.pdfId,
    company: balanceSheet.Engagement?.Company,
    engagement: balanceSheet.Engagement,
    totals: {
      assets: balanceSheet.totalAssetAmount,
      liabilities: balanceSheet.totalLiabilityAmount,
    },
    categories: grouped,
  };
};

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

    const payload = buildFinancialPayload(balanceSheet);

    return res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pdf/latest
 * Returns the latest completed PDF (if any) with parsed and financial data
 */
export const getLatestPdf = async (_req, res, next) => {
  try {
    const pdf = await PdfDocument.findOne({
      where: { status: "COMPLETED" },
      order: [["uploadedAt", "DESC"]],
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "No processed PDF found",
      });
    }

    const parsed = await PdfParsedData.findOne({ where: { pdfId: pdf.id } });
    const balanceSheet = await BalanceSheet.findOne({
      where: { pdfId: pdf.id },
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

    return res.json({
      success: true,
      data: {
        pdfId: pdf.id,
        status: pdf.status,
        uploadedAt: pdf.uploadedAt,
        completedAt: pdf.completedAt,
        parsed: parsed
          ? { text: parsed.parsedText, pageCount: parsed.pageCount }
          : null,
        financial: buildFinancialPayload(balanceSheet),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pdf/file/:pdfId
 * Streams the stored PDF file if available
 */
export const getPdfFile = async (req, res, next) => {
  try {
    const { pdfId } = req.params;
    const pdf = await PdfDocument.findByPk(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "PDF not found",
      });
    }

    if (!pdf.storedPath) {
      return res.status(404).json({
        success: false,
        message: "No stored file path for this PDF",
      });
    }

    const resolvedPath = path.resolve(pdf.storedPath);
    const exists = await fs.promises
      .access(resolvedPath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Stored PDF file not found on disk",
      });
    }

    res.setHeader("Content-Type", pdf.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${pdf.originalName || "document.pdf"}"`
    );

    return res.sendFile(resolvedPath);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/pdf/annotate
 * Updates financial data and returns a generated PDF
 */
export const annotatePdf = async (req, res, next) => {
  try {
    const { pdfId, companyName, engagementName, assets = [], liabilities = [] } =
      req.body;

    if (!pdfId) {
      return res
        .status(400)
        .json({ success: false, message: "pdfId is required" });
    }

    const pdf = await PdfDocument.findByPk(pdfId);

    if (!pdf) {
      return res
        .status(404)
        .json({ success: false, message: "PDF not found for annotation" });
    }

    if (pdf.status !== "COMPLETED") {
      return res.status(409).json({
        success: false,
        message: "PDF processing not completed",
        status: pdf.status,
      });
    }

    const normalizedAssets = normalizeLineItems(assets);
    const normalizedLiabilities = normalizeLineItems(liabilities);

    const totals = {
      assets: Number(
        normalizedAssets.reduce((sum, item) => sum + toNumber(item.amount), 0).toFixed(2)
      ),
      liabilities: Number(
        normalizedLiabilities.reduce((sum, item) => sum + toNumber(item.amount), 0).toFixed(2)
      ),
    };

    const finalCompany = (companyName || pdf.originalName || "Financial Statement").trim();
    const finalEngagement = (engagementName || "Balance Sheet").trim();

    await sequelize.transaction(async (t) => {
      const [company] = await Company.findOrCreate({
        where: { name: finalCompany },
        defaults: { name: finalCompany },
        transaction: t,
      });

      const [engagement] = await Engagement.findOrCreate({
        where: { companyId: company.id, name: finalEngagement },
        defaults: { companyId: company.id, name: finalEngagement },
        transaction: t,
      });

      const [assetCategory] = await Category.findOrCreate({
        where: { name: "Assets" },
        defaults: { name: "Assets" },
        transaction: t,
      });

      const [liabilityCategory] = await Category.findOrCreate({
        where: { name: "Liabilities & Equity" },
        defaults: { name: "Liabilities & Equity" },
        transaction: t,
      });

      const [balanceSheet] = await BalanceSheet.findOrCreate({
        where: { pdfId },
        defaults: {
          pdfId,
          engagementId: engagement.id,
          totalAssetAmount: totals.assets,
          totalLiabilityAmount: totals.liabilities,
        },
        transaction: t,
      });

      await balanceSheet.update(
        {
          engagementId: engagement.id,
          totalAssetAmount: totals.assets,
          totalLiabilityAmount: totals.liabilities,
        },
        { transaction: t }
      );

      const syncItems = async (category, items) => {
        const existing = await BalanceSheetItem.findAll({
          where: { balanceSheetId: balanceSheet.id, categoryId: category.id },
          transaction: t,
        });

        const keepCategoryItemIds = new Set();

        for (const item of items) {
          const [categoryItem] = await CategoryItem.findOrCreate({
            where: { categoryId: category.id, name: item.name },
            defaults: { categoryId: category.id, name: item.name },
            transaction: t,
          });

          keepCategoryItemIds.add(categoryItem.id);

          const [balanceSheetItem] = await BalanceSheetItem.findOrCreate({
            where: {
              balanceSheetId: balanceSheet.id,
              categoryItemId: categoryItem.id,
            },
            defaults: {
              balanceSheetId: balanceSheet.id,
              categoryId: category.id,
              categoryItemId: categoryItem.id,
              amount: item.amount,
            },
            transaction: t,
          });

          await balanceSheetItem.update(
            { categoryId: category.id, amount: item.amount },
            { transaction: t }
          );
        }

        const stale = existing.filter(
          (item) => !keepCategoryItemIds.has(item.categoryItemId)
        );

        for (const item of stale) {
          await item.destroy({ transaction: t });
        }
      };

      await syncItems(assetCategory, normalizedAssets);
      await syncItems(liabilityCategory, normalizedLiabilities);

      const parsedText = [
        finalCompany,
        finalEngagement,
        "Assets",
        ...normalizedAssets.map(
          (item) => `${item.name}: ${toNumber(item.amount).toFixed(2)}`
        ),
        "Liabilities & Equity",
        ...normalizedLiabilities.map(
          (item) => `${item.name}: ${toNumber(item.amount).toFixed(2)}`
        ),
      ].join("\n");

      const existingParsed = await PdfParsedData.findOne({
        where: { pdfId },
        transaction: t,
      });

      if (existingParsed) {
        await existingParsed.update(
          { parsedText, pageCount: existingParsed.pageCount || 1 },
          { transaction: t }
        );
      } else {
        await PdfParsedData.create(
          { pdfId, parsedText, pageCount: 1 },
          { transaction: t }
        );
      }
    });

    const pdfBuffer = await generateAnnotatedPdf({
      companyName: finalCompany,
      engagementName: finalEngagement,
      assets: normalizedAssets,
      liabilities: normalizedLiabilities,
      totals,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="annotated-${pdfId}.pdf"`
    );
    res.setHeader("X-Pdf-Id", pdfId);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
