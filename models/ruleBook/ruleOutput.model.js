import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Rule } from "./rule.model.js";

export const RuleOutput = sequelize.define(
  "RuleOutput",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Rule, key: "id" },
    },
    A: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    B: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
  },
  {
    tableName: "rule_output",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

Rule.hasOne(RuleOutput, { foreignKey: "rule_id" });
RuleOutput.belongsTo(Rule, { foreignKey: "rule_id" });
