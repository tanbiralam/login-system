import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const InvalidRecord = sequelize.define(
  "InvalidRecord",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "CsvFiles", key: "id" },
    },

    rawData: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    errorReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "InvalidRecords",
    timestamps: false,
    indexes: [{ fields: ["fileId"] }],
  }
);
