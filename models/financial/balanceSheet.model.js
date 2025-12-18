import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Engagement } from "./engagement.model.js";
import { PdfDocument } from "../pdfDocument.model.js";

export const BalanceSheet = sequelize.define(
  "BalanceSheet",
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
    engagementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "engagements",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    totalAssetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalLiabilityAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "balance_sheets",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["pdfId"],
      },
      {
        fields: ["engagementId"],
        unique: true,
      },
    ],
  }
);

Engagement.hasOne(BalanceSheet, { foreignKey: "engagementId" });
BalanceSheet.belongsTo(Engagement, { foreignKey: "engagementId" });
PdfDocument.hasOne(BalanceSheet, { foreignKey: "pdfId" });
BalanceSheet.belongsTo(PdfDocument, { foreignKey: "pdfId" });
