import fs from "fs";
import XLSX from "xlsx";

import { Product } from "../models/ruleBook/product.model.js";
import { Rule } from "../models/ruleBook/rule.model.js";
import { RuleCriteria } from "../models/ruleBook/ruleCriteria.model.js";
import { MetaData } from "../models/ruleBook/metaData.model.js";
import { RuleOutput } from "../models/ruleBook/ruleOutput.model.js";

async function ensureMetaData(name, datatype = "string") {
  const [meta] = await MetaData.findOrCreate({
    where: { name },
    defaults: { datatype },
  });
  return meta;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value !== "") {
    return asNumber;
  }
  return String(value).trim();
}

function matchesCriterion(inputValue, operator, criterionValue) {
  if (inputValue === null || inputValue === undefined) return false;

  const inputNormalized = normalizeValue(inputValue);
  const criterionNormalized = normalizeValue(criterionValue);

  if (operator === "=") {
    return inputNormalized === criterionNormalized;
  }

  if (operator === "in") {
    const list = String(criterionNormalized)
      .split(",")
      .map((v) => normalizeValue(v));
    return list.some((v) => v === inputNormalized);
  }

  if (operator === "between") {
    const [minRaw, maxRaw] = String(criterionNormalized).split("-");
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    if (typeof inputNormalized !== "number") return false;
    return inputNormalized >= min && inputNormalized <= max;
  }

  if (["<", ">", "<=", ">="].includes(operator)) {
    if (typeof inputNormalized !== "number") return false;
    const target = Number(criterionNormalized);
    if (Number.isNaN(target)) return false;
    switch (operator) {
      case "<":
        return inputNormalized < target;
      case ">":
        return inputNormalized > target;
      case "<=":
        return inputNormalized <= target;
      case ">=":
        return inputNormalized >= target;
      default:
        return false;
    }
  }

  return false;
}

function parseScoreOperator(scoreValue) {
  scoreValue = String(scoreValue).trim();

  if (scoreValue.includes("-")) {
    return { operator: "between", value: scoreValue };
  }
  if (scoreValue.startsWith("<")) {
    return { operator: "<", value: scoreValue.substring(1) };
  }
  if (scoreValue.startsWith(">")) {
    return { operator: ">", value: scoreValue.substring(1) };
  }
  if (scoreValue.startsWith("=")) {
    return { operator: "=", value: scoreValue.substring(1) };
  }

  return { operator: "=", value: scoreValue };
}

export async function uploadAndSync(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    const scoreMeta = await ensureMetaData("score");
    const typeMeta = await ensureMetaData("type");

    if (!scoreMeta || !typeMeta) {
      return res.status(500).json({
        message: "MetaData for 'score' and 'type' must exist before importing.",
      });
    }

    for (const row of rows) {
      const productName = row.Product;

      const [product] = await Product.findOrCreate({
        where: { product_name: productName },
      });

      const rule = await Rule.create({
        product_id: product.id,
        rule_name: `Excel Rule ${row.Id}`,
      });

      const parsed = parseScoreOperator(row.score);

      await RuleCriteria.bulkCreate([
        {
          rule_id: rule.id,
          metadata_id: scoreMeta.id,
          operator: parsed.operator,
          value: parsed.value,
        },
        {
          rule_id: rule.id,
          metadata_id: typeMeta.id,
          operator: "=",
          value: row.type,
        },
      ]);

      await RuleOutput.create({
        rule_id: rule.id,
        A: row.A,
        B: row.B,
      });
    }

    fs.unlinkSync(filePath);

    return res.json({
      message: "Rules synchronized successfully",
      count: rows.length,
    });
  } catch (error) {
    console.error("Excel Sync Error:", error);
    return res.status(500).json({
      message: "Error processing file",
      error: error.message,
    });
  }
}

export async function evaluateRules(req, res) {
  try {
    const { product: productNameFromBody, ...payload } = req.body || {};

    let rules = [];
    if (productNameFromBody) {
      const product = await Product.findOne({
        where: { product_name: productNameFromBody },
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      rules = await Rule.findAll({
        where: { product_id: product.id },
        include: [
          { model: RuleCriteria, include: [{ model: MetaData }] },
          { model: RuleOutput },
        ],
        order: [["id", "ASC"]],
      });
    } else {
      rules = await Rule.findAll({
        include: [
          { model: RuleCriteria, include: [{ model: MetaData }] },
          { model: RuleOutput },
        ],
        order: [
          ["product_id", "ASC"],
          ["id", "ASC"],
        ],
      });
    }

    if (!rules.length) {
      return res.status(404).json({ message: "No rules configured." });
    }

    for (const rule of rules) {
      const criteria = rule.RuleCriteria || [];
      const output = rule.RuleOutput;

      const allMatch = criteria.every((criterion) => {
        const fieldName =
          criterion.MetaDatum?.name ||
          criterion.MetaData?.name ||
          criterion.MetaDatas?.name;
        const inputValue = payload[fieldName];
        return matchesCriterion(
          inputValue,
          criterion.operator,
          criterion.value
        );
      });

      if (allMatch && output) {
        return res.json({
          output: {
            A: output.A,
            B: output.B,
          },
        });
      }
    }

    return res.status(404).json({ message: "No matching rule found." });
  } catch (error) {
    console.error("Rule Evaluation Error:", error);
    return res.status(500).json({
      message: "Error evaluating rules",
      error: error.message,
    });
  }
}
