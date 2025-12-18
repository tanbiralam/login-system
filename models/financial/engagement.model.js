import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const Engagement = sequelize.define(
  "Engagement",
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
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "engagements",
    timestamps: true,
  }
);
