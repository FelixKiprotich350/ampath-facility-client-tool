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
  let rawquery = indicatorObj.query as string;

  // Replace date placeholders
  rawquery = rawquery.replace(/'2025-11-01'/g, `'${startDate}'`);

  const connection = await mysql.createConnection({
    ...kenyaemrDbConfig,
    multipleStatements: true
  });
  
  try {
    const statements = rawquery.split(';').filter(s => s.trim());
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
