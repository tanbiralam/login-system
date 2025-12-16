import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const PdfDocument = sequelize.define(
  "PdfDocument",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    storedPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    errorReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "pdf_documents",
    timestamps: false,
  }
);
