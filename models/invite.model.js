import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Invite = sequelize.define(
  "Invite",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "Invites",
    timestamps: true,
  }
);
