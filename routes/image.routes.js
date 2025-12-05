import express from "express";
import { uploadImage } from "../controllers/image.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/upload", protect, upload.single("image"), uploadImage);

export default router;
