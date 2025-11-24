import mysql from "mysql2/promise";

const localDbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

const kenyaemrDbConfig = {
  host: process.env.KENYAEMR_DB_HOST,
  user: process.env.KENYAEMR_DB_USER,
  password: process.env.KENYAEMR_DB_PASSWORD,
  database: process.env.KENYAEMR_DB_NAME,
};

export async function fetchFromDatabase(query: string, params: any[] = []) {
  const connection = await mysql.createConnection(localDbConfig);
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

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
