import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { PdfDocument } from "./pdfDocument.model.js";

export const PdfParsedData = sequelize.define(
  "PdfParsedData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    pdfId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pdf_documents",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    parsedText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    pageCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "pdf_parsed_data",
    timestamps: false,
    indexes: [
      {
        fields: ["pdfId"],
        unique: true,
      },
    ],
  }
);

PdfDocument.hasOne(PdfParsedData, { foreignKey: "pdfId" });
PdfParsedData.belongsTo(PdfDocument, { foreignKey: "pdfId" });
