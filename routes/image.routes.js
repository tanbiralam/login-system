import express from "express";
import { uploadImage, readImageText } from "../controllers/image.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

const rawImage = express.raw({ type: "image/*", limit: "5mb" });

const imageIngest = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.startsWith("multipart/")) {
    return upload.single("image")(req, res, next);
  }

  return rawImage(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

router.post("/upload", protect, upload.single("image"), uploadImage);
router.post("/ocr", protect, imageIngest, readImageText);

export default router;
