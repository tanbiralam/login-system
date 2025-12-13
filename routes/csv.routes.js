import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  uploadCsv,
  getCsvStatusController,
} from "../controllers/csv.controller.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "upload", "csv");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/upload", upload.single("file"), uploadCsv);
router.get("/status/:fileId", getCsvStatusController);

export default router;
