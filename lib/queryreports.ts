import mysql from "mysql2/promise";
import { readFileSync } from "fs";
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
  reportType: string,
  startDate: string,
  endDate: string
) {
  const queryPath = join(process.cwd(), "databasequeries", `${reportType}.sql`);
  let query = readFileSync(queryPath, "utf8");

  // Replace date placeholders
  query = query.replace(/'2025-11-01'/g, `'${startDate}'`);

  const connection = await mysql.createConnection({
    ...kenyaemrDbConfig,
    multipleStatements: true
  });
  
  try {
    const statements = query.split(';').filter(s => s.trim());
    let result;
    
    for (const statement of statements) {
      if (statement.trim()) {
        const [rows] = await connection.execute(statement.trim());
        if (statement.trim().toUpperCase().startsWith('SELECT')) {
          result = rows;
        }
      }
    }
    return result as DbQueryResult[];
  } finally {
    await connection.end();
  }
}
