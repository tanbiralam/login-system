import PDFDocument from "pdfkit";

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
