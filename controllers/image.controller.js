import { Image } from "../models/image.model.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("File Info", req.file);

    const { originalname, mimetype, buffer } = req.file;

    const newImage = await Image.create({
      filename: originalname,
      mimetype: req.file.mimetype,
      data: buffer,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        id: newImage.id,
        filename: newImage.filename,
        mimetype: newImage.mimetype,
        createdAt: newImage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
