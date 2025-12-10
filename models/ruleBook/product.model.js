import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "products",
    timestamps: false,
  }
);
