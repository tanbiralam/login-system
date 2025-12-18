import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const CategoryItem = sequelize.define(
  "CategoryItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "category_items",
    timestamps: false,
  }
);
