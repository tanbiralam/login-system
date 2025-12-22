import { recognize } from "node-native-ocr";
import sharp from "sharp";
import { Image } from "../models/image.model.js";
import { ImageChunk } from "../models/imageChunk.model.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { originalname, mimetype, buffer } = req.file;

    if (!mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only images allowed.",
      });
    }

    const newImage = await Image.create({
      filename: originalname,
      mimeType: mimetype,
      // data: buffer,
      userId: req.user?.id,
    });

    const CHUNK_SIZE = 1024 * 1024;
    let index = 0;

    for (let start = 0; start < buffer.length; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE;
      const chunkBuffer = buffer.slice(start, end);

      await ImageChunk.create({
        imageId: newImage.id,
        chunkIndex: index,
        data: chunkBuffer,
      });

      index++;
    }

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      imageId: newImage.id,
      chunks: index,
    });
  } catch (error) {
    next(error);
  }
};

export const readImageText = async (req, res, next) => {
  try {
    const mimeType = req.file?.mimetype || req.headers["content-type"];
    const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : null;
    const buffer = req.file?.buffer || (bodyBuffer?.length ? bodyBuffer : null);

    if (!buffer) {
      return res.status(400).json({
        success: false,
        message: "No image content provided",
      });
    }

    if (!mimeType || !mimeType.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only images allowed.",
      });
    }

    // Allow callers to override the default OCR language; default stays as library default.
    const langOption = req.query?.lang || req.body?.lang;
    const options =
      langOption && typeof langOption === "string"
        ? { lang: langOption }
        : undefined;

    // Normalize image to JPEG to avoid leptonica format issues (e.g., missing PNG support).
    const normalizedBuffer = await sharp(buffer).jpeg().toBuffer();

    const text = await recognize(normalizedBuffer, options);

    return res.status(200).json({
      success: true,
      message: "Image processed successfully",
      text,
    });
  } catch (error) {
    next(error);
  }
};

const rebuildImageBuffer = async (imageId) => {
  const chunks = await ImageChunk.findAll({
    where: { imageId },
    order: [["chunkIndex", "ASC"]],
  });

  if (!chunks.length) {
    const error = new Error("Image data not found for OCR");
    error.status = 404;
    throw error;
  }

  return Buffer.concat(chunks.map((chunk) => chunk.data));
};
