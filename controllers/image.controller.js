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
