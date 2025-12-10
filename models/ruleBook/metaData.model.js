import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const MetaData = sequelize.define(
  "MetaData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    datatype: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "meta_data",
    timestamps: false,
  }
);
