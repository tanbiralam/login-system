import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { BalanceSheet } from "./balanceSheet.model.js";
import { Category } from "./category.model.js";
import { CategoryItem } from "./categoryItem.model.js";

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
      references: {
        model: "balance_sheets",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "RESTRICT",
    },
    categoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "category_items",
        key: "id",
      },
      onDelete: "RESTRICT",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "balance_sheet_items",
    timestamps: true,
    indexes: [
      {
        fields: ["balanceSheetId"],
      },
      {
        fields: ["categoryId"],
      },
      {
        fields: ["categoryItemId"],
      },
      {
        unique: true,
        fields: ["balanceSheetId", "categoryItemId"],
      },
    ],
  }
);

BalanceSheet.hasMany(BalanceSheetItem, { foreignKey: "balanceSheetId" });
BalanceSheetItem.belongsTo(BalanceSheet, { foreignKey: "balanceSheetId" });

Category.hasMany(BalanceSheetItem, { foreignKey: "categoryId" });
BalanceSheetItem.belongsTo(Category, { foreignKey: "categoryId" });

CategoryItem.hasMany(BalanceSheetItem, { foreignKey: "categoryItemId" });
BalanceSheetItem.belongsTo(CategoryItem, { foreignKey: "categoryItemId" });
