import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'facility_db'
}

export async function fetchFromDatabase(query: string, params: any[] = []) {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const [rows] = await connection.execute(query, params)
    return rows
  } finally {
    await connection.end()
  }
}