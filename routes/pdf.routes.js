import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
  uploadPdf,
  getPdfStatus,
  getPdfResult,
  getPdfFinancial,
  getLatestPdf,
  getPdfFile,
  annotatePdf,
} from "../controllers/pdf.controller.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "pdf");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

router.post("/upload", upload.single("file"), uploadPdf);
router.get("/latest", getLatestPdf);
router.get("/status/:pdfId", getPdfStatus);
router.get("/result/:pdfId", getPdfResult);
router.get("/financial/:pdfId", getPdfFinancial);
router.get("/file/:pdfId", getPdfFile);
router.post("/annotate", annotatePdf);

export default router;
