import mysql from "mysql2/promise";
import { join } from "path";

const kenyaemrDbConfig = {
  host: process.env.KENYAEMR_DB_HOST,
  user: process.env.KENYAEMR_DB_USER,
  password: process.env.KENYAEMR_DB_PASSWORD,
  database: process.env.KENYAEMR_DB_NAME,
};
export type DbQueryResult = {
  gender: number;
  age_band: string;
  count: string;
  startDate?: Date;
  endDate?: Date;
};

export async function fetchFromKenyaEMRDatabase(
  query: string,
  params: any[] = []
) {
  const connection = await mysql.createConnection(kenyaemrDbConfig);
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

export async function executeReportQuery(
  indicatorObj: any,
  startDate: string,
  endDate: string
) {
  const oldquery = indicatorObj.query as string;

  // Replace date placeholders
  const finalQuery = replacePlaceholders(
    oldquery,
    ["AMPATH_REPORT_START_DATE", "AMPATH_REPORT_END_DATE"],
    [`'${startDate}'`, `'${endDate}'`]
  );

  const connection = await mysql.createConnection({
    ...kenyaemrDbConfig,
    multipleStatements: true,
  });

  try {
    const statements = finalQuery.split(";").filter((s) => s.trim());
    let result;

    for (const statement of statements) {
      if (statement.trim()) {
        const [rows] = await connection.execute(statement.trim());
        if (statement.trim().toUpperCase().startsWith("SELECT")) {
          result = rows;
        }
      }
    }
    return result as DbQueryResult[];
  } finally {
    await connection.end();
  }
}

function replacePlaceholders(originalString, placeholders = [], values = []) {
  if (!originalString) return originalString;

  if (!Array.isArray(placeholders) || !Array.isArray(values)) {
    throw new Error("placeholders and values must be arrays");
  }

  if (placeholders.length !== values.length) {
    throw new Error("placeholders and values must have the same length");
  }

  let result = originalString;

  placeholders.forEach((p, index) => {
    if (!p) return;

    const placeholder = `'{{${p}}}'`;
    const value = values[index];
    // Escape regex special characters in the placeholder
    const escapedPlaceholder = placeholder.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(escapedPlaceholder, "g");

    result = result.replace(regex, value);
  });

  return result;
}
