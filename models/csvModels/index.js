import { CsvFile } from "./csvFile.model.js";
import { ValidRecord } from "./validRecord.model.js";
import { InvalidRecord } from "./invalidRecord.model.js";

CsvFile.hasMany(ValidRecord, { foreignKey: "fileId" });
CsvFile.hasMany(InvalidRecord, { foreignKey: "fileId" });

ValidRecord.belongsTo(CsvFile, { foreignKey: "fileId" });
InvalidRecord.belongsTo(CsvFile, { foreignKey: "fileId" });

export { CsvFile, ValidRecord, InvalidRecord };
