import fs from "fs/promises";
import PDFDocument from "pdfkit";
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const { getDocument, GlobalWorkerOptions } = pdfjs;
GlobalWorkerOptions.disableWorker = true; // node environment

const formatCurrency = (value) => {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return "0.00";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const drawLineItems = (doc, title, items, total) => {
  doc.fontSize(14).text(title, { underline: true });
  doc.moveDown(0.35);

  if (!items.length) {
    doc.fontSize(11).fillColor("#666").text("No items provided");
    doc.moveDown(0.5);
    doc.fillColor("#000");
    return;
  }

  doc.fontSize(11).fillColor("#000");
  items.forEach((item) => {
    doc.text(`${item.name}: ${formatCurrency(item.amount)}`);
  });

  doc.moveDown(0.4);
  doc.fontSize(12).text(`Total ${title}: ${formatCurrency(total)}`);
  doc.moveDown();
};

export const generateAnnotatedPdf = ({
  companyName,
  engagementName,
  assets = [],
  liabilities = [],
  totals = { assets: 0, liabilities: 0 },
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(companyName || "Financial Statement", {
      align: "center",
    });
    doc.moveDown(0.35);
    doc
      .fontSize(12)
      .fillColor("#555")
      .text(engagementName || "Balance Sheet", { align: "center" });
    doc.moveDown();
    doc.fillColor("#000");

    drawLineItems(doc, "Assets", assets, totals.assets);
    drawLineItems(doc, "Liabilities & Equity", liabilities, totals.liabilities);

    doc
      .fontSize(9)
      .fillColor("#666")
      .text(
        "Generated from PDF annotations. Please review values before distribution.",
        { align: "center", baseline: "bottom" }
      );

    doc.end();
  });

const toTopLeftY = (viewportHeight, bottomY) =>
  Number((viewportHeight - bottomY).toFixed(2));

const toFontSize = (a, b) => Number(Math.hypot(a, b).toFixed(2));

export const extractPdfStructure = async (pdfPath) => {
  const fileBuffer = await fs.readFile(pdfPath);
  const task = getDocument({ data: fileBuffer });
  const pdf = await task.promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items = content.items.map((item) => {
      const [a, b, _c, d, e, f] = item.transform;
      const fontSize = toFontSize(a, b);
      const height = Number((item.height || fontSize).toFixed(2));
      const width = Number((item.width || 0).toFixed(2));

      return {
        text: item.str,
        x: Number(e.toFixed(2)),
        y: toTopLeftY(viewport.height, f),
        width,
        height,
        fontSize,
      };
    });

    pages.push({
      pageNumber,
      width: Number(viewport.width.toFixed(2)),
      height: Number(viewport.height.toFixed(2)),
      items,
    });
  }

  await task.destroy();
  return pages;
};

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return rgb(0, 0, 0);
  const bigint = parseInt(normalized, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
};

export const updatePdfInPlace = async (pdfPath, updates = []) => {
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  updates.forEach((update) => {
    const pageIndex = (update.pageNumber || 1) - 1;
    const page = pages[pageIndex];
    if (!page || !update.text) return;

    const pageHeight = page.getHeight();
    const x = Number(update.x || 0);
    const yTop = Number(update.y || 0);
    const y = pageHeight - yTop;
    const fontSize = Number(update.fontSize || 12);
    const width = Number(update.width || font.widthOfTextAtSize(update.text, fontSize));
    const height = Number(update.height || fontSize * 1.2);
    const color = update.color ? hexToRgb(update.color) : rgb(0, 0, 0);

    // cover old text area
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: rgb(1, 1, 1),
      borderColor: rgb(1, 1, 1),
    });

    page.drawText(update.text, {
      x,
      y: y - height + (height - fontSize),
      size: fontSize,
      font,
      color,
    });
  });

  const updatedBytes = await pdfDoc.save();
  await fs.writeFile(pdfPath, updatedBytes);
  return updatedBytes;
};

export const logPdfTextPositions = async (pdfPath) => {
  const structure = await extractPdfStructure(pdfPath);
  structure.forEach((page) => {
    console.log(
      `[PDF][PAGE ${page.pageNumber}] size=${page.width}x${page.height}`
    );
    page.items.forEach((item) => {
      console.log(
        `  text="${item.text}" x=${item.x} y=${item.y} w=${item.width} h=${item.height} size=${item.fontSize}`
      );
    });
  });
  return structure;
};
