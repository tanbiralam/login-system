import fs from "fs";
import { PDFParse } from "pdf-parse";

import { buildWorker } from "../queues/queue.config.js";
import { PDF_PROCESSING_QUEUE } from "../queues/pdfProcessing.queue.js";

import { PdfDocument } from "../models/pdfDocument.model.js";
import { PdfParsedData } from "../models/pdfParsedData.model.js";
import { Company } from "../models/financial/company.model.js";
import { Engagement } from "../models/financial/engagement.model.js";
import { BalanceSheet } from "../models/financial/balanceSheet.model.js";
import { BalanceSheetItem } from "../models/financial/balanceSheetItem.model.js";
import { Category } from "../models/financial/category.model.js";
import { CategoryItem } from "../models/financial/categoryItem.model.js";

const stripEmptyLines = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const toAmount = (raw) => {
  const cleaned = String(raw || "").replace(/[^0-9.-]/g, "");
  return cleaned ? cleaned : null;
};

const isAmountLine = (line) =>
  /^[-+]?\d[\d,]*(\.\d+)?$/.test(line.replace(/[^0-9.,-]/g, ""));

const extractInlineItem = (line) => {
  const amountMatch = line.match(/([-+]?\d[\d,]*(?:\.\d+)?)(?!.*\d)/);
  if (!amountMatch) return null;
  const amount = toAmount(amountMatch[1]);
  const name = line
    .replace(amountMatch[0], "")
    .trim()
    .replace(/[:\-–]+$/, "")
    .trim();
  if (!name || !amount) return null;
  return { name, amount };
};

const parseCategoryBlock = (lines) => {
  const items = [];
  let pendingName = null;
  let total = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // skip headers
    if (/^amount\b/i.test(line)) continue;

    // capture totals
    if (/total/i.test(line)) {
      const inline = extractInlineItem(line);
      if (inline?.amount) {
        total = inline.amount;
        continue;
      }
      const next = lines[i + 1];
      if (next && isAmountLine(next)) {
        total = toAmount(next);
        i += 1;
        continue;
      }
    }

    const inline = extractInlineItem(line);
    if (inline) {
      items.push(inline);
      pendingName = null;
      continue;
    }

    if (isAmountLine(line) && pendingName) {
      items.push({ name: pendingName, amount: toAmount(line) });
      pendingName = null;
      continue;
    }

    // keep as candidate name
    pendingName = line;
  }

  const totalAmount =
    total ??
    items.reduce((sum, item) => {
      const next = parseFloat(item.amount);
      return sum + (Number.isFinite(next) ? next : 0);
    }, 0);

  return { items, total: String(totalAmount) };
};

const parseBalanceSheetText = (text) => {
  const lines = stripEmptyLines(text);
  if (!lines.length) {
    throw new Error("PDF text is empty");
  }

  const companyName = lines[0];
  const statementLine =
    lines.find((l) => /balance\s*sheet/i.test(l)) || "Balance Sheet";
  const engagementName = statementLine;

  const assetsIdx = lines.findIndex((l) => /^assets\b/i.test(l));
  const liabilitiesIdx = lines.findIndex(
    (l, idx) => idx > assetsIdx && /liabilities/i.test(l)
  );

  if (assetsIdx === -1 || liabilitiesIdx === -1) {
    throw new Error("Unable to locate Assets / Liabilities sections");
  }

  const assetLines = lines.slice(assetsIdx + 1, liabilitiesIdx);
  const liabilityLines = lines.slice(liabilitiesIdx + 1);

  const assets = parseCategoryBlock(assetLines);
  const liabilities = parseCategoryBlock(liabilityLines);

  return {
    companyName,
    engagementName,
    assets,
    liabilities,
  };
};

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

    let parser;
    try {
      await PdfDocument.update(
        { status: "PROCESSING" },
        { where: { id: pdfId } }
      );

      const fileBuffer = await fs.promises.readFile(pdfPath);
      parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getText();

      const structured = parseBalanceSheetText(parsed.text);

      await PdfParsedData.create({
        pdfId,
        parsedText: parsed.text,
        pageCount: parsed.total,
      });

      // Company & engagement
      const [company] = await Company.findOrCreate({
        where: { name: structured.companyName },
        defaults: { name: structured.companyName },
      });

      const [engagement] = await Engagement.findOrCreate({
        where: { companyId: company.id, name: structured.engagementName },
        defaults: { companyId: company.id, name: structured.engagementName },
      });

      // Categories
      const [assetCategory] = await Category.findOrCreate({
        where: { name: "Assets" },
        defaults: { name: "Assets" },
      });
      const [liabilityCategory] = await Category.findOrCreate({
        where: { name: "Liabilities & Equity" },
        defaults: { name: "Liabilities & Equity" },
      });

      // Balance sheet
      const [balanceSheet] = await BalanceSheet.findOrCreate({
        where: { pdfId },
        defaults: {
          pdfId,
          engagementId: engagement.id,
          totalAssetAmount: structured.assets.total,
          totalLiabilityAmount: structured.liabilities.total,
        },
      });

      await balanceSheet.update({
        engagementId: engagement.id,
        totalAssetAmount: structured.assets.total,
        totalLiabilityAmount: structured.liabilities.total,
      });

      const upsertItem = async (category, item) => {
        const [categoryItem] = await CategoryItem.findOrCreate({
          where: { categoryId: category.id, name: item.name },
          defaults: { categoryId: category.id, name: item.name },
        });

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
        });

        await balanceSheetItem.update({
          categoryId: category.id,
          amount: item.amount,
        });
      };

      for (const item of structured.assets.items) {
        await upsertItem(assetCategory, item);
      }

      for (const item of structured.liabilities.items) {
        await upsertItem(liabilityCategory, item);
      }

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
        pages: parsed.total,
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
      if (parser) {
        await parser.destroy().catch(() => {});
      }
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
