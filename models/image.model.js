import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { User } from "../models/user.model.js";

export const Image = sequelize.define(
  "Image",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Images",
    timestamps: true,
  }
);

User.hasMany(Image, { foreignKey: "userId" });
Image.belongsTo(User, { foreignKey: "userId" });
