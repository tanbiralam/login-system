import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const BalanceSheet = sequelize.define(
  "BalanceSheet",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    engagementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAssetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    totalLiabilityAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
  },
  {
    tableName: "balance_sheets",
    timestamps: true,
  }
);
