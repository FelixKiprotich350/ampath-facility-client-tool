import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { join } from "path";

const kenyaemrDbConfig = {
  host: process.env.KENYAEMR_DB_HOST,
  user: process.env.KENYAEMR_DB_USER,
  password: process.env.KENYAEMR_DB_PASSWORD,
  database: process.env.KENYAEMR_DB_NAME,
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

  return await fetchFromKenyaEMRDatabase(query);
}
