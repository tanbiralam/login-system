import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";
import { Rule } from "./rule.model.js";
import { MetaData } from "./metaData.model.js";

export const RuleCriteria = sequelize.define(
  "RuleCriteria",
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
    metadata_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: MetaData, key: "id" },
    },
    operator: {
      type: DataTypes.ENUM("=", ">", "<", ">=", "<=", "between", "in"),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    tableName: "rule_criteria",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

Rule.hasMany(RuleCriteria, { foreignKey: "rule_id" });
RuleCriteria.belongsTo(Rule, { foreignKey: "rule_id" });

MetaData.hasMany(RuleCriteria, { foreignKey: "metadata_id" });
RuleCriteria.belongsTo(MetaData, { foreignKey: "metadata_id" });
