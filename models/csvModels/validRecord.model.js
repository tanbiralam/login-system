import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const ValidRecord = sequelize.define(
  "ValidRecord",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "CsvFiles", key: "id" },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "ValidRecords",
    timestamps: false,
    indexes: [{ fields: ["fileId"] }],
  }
);
