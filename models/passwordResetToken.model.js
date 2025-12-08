import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { User } from "./user.model.js";

export const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
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
    tableName: "PasswordResetTokens",
    timestamps: true,
  }
);

User.hasMany(PasswordResetToken, { foreignKey: "userId" });
PasswordResetToken.belongsTo(User, { foreignKey: "userId" });
