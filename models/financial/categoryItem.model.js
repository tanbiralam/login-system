import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Category } from "./category.model.js";

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
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "category_items",
    timestamps: true,
    indexes: [
      {
        fields: ["categoryId"],
      },
      {
        unique: true,
        fields: ["categoryId", "name"],
      },
    ],
  }
);

Category.hasMany(CategoryItem, { foreignKey: "categoryId" });
CategoryItem.belongsTo(Category, { foreignKey: "categoryId" });
