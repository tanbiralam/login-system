import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { Image } from "./image.model.js";

export const ImageChunk = sequelize.define(
  "ImageChunk",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chunkIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
  },
  {
    tableName: "ImageChunks",
    timestamps: true,
  }
);

Image.hasMany(ImageChunk, { foreignKey: "imageId" });
ImageChunk.belongsTo(Image, { foreignKey: "imageId" });
