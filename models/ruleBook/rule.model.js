import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Product } from "./product.model.js";

export const Rule = sequelize.define(
  "Rule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Product, key: "id" },
    },
    rule_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: "rules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Product.hasMany(Rule, { foreignKey: "product_id" });
Rule.belongsTo(Product, { foreignKey: "product_id" });
