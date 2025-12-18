import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Company } from "./company.model.js";

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
      references: {
        model: "companies",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "engagements",
    timestamps: true,
    indexes: [
      {
        fields: ["companyId"],
      },
      {
        unique: true,
        fields: ["companyId", "name"],
      },
    ],
  }
);

Company.hasMany(Engagement, { foreignKey: "companyId" });
Engagement.belongsTo(Company, { foreignKey: "companyId" });
