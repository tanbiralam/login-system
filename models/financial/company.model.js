import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "companies",
    timestamps: false,
  }
);
