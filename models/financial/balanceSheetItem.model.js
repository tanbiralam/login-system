import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const BalanceSheetItem = sequelize.define(
  "BalanceSheetItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    balanceSheetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
  },
  {
    tableName: "balance_sheet_items",
    timestamps: true,
  }
);
