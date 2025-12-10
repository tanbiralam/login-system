import express from "express";
import { uploadAndSync } from "../controllers/excel.controller.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Ensure the upload directory exists before writing files
const uploadDir = path.join(process.cwd(), "upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/upload-rules", upload.single("file"), uploadAndSync);

export default router;
