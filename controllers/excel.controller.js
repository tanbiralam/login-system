import fs from "fs";
import XLSX from "xlsx";

import { Product } from "../models/ruleBook/product.model.js";
import { Rule } from "../models/ruleBook/rule.model.js";
import { RuleCriteria } from "../models/ruleBook/ruleCriteria.model.js";
import { MetaData } from "../models/ruleBook/metaData.model.js";
import { RuleOutput } from "../models/ruleBook/ruleOutput.model.js";

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

    const scoreMeta = await MetaData.findOne({ where: { name: "score" } });
    const typeMeta = await MetaData.findOne({ where: { name: "type" } });

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
