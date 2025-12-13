import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const CsvFile = sequelize.define(
  "CsvFile",
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

    totalRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    validRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    invalidRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    webhookStatus: {
      type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    webhookAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    nextWebhookAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    lastWebhookError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "CsvFiles",
    timestamps: false,
  }
);
