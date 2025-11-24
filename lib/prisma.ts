import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './prisma/client';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'test',
  database: process.env.DATABASE_NAME || 'ampath_facility_tool',
  connectionLimit: 20,
  acquireTimeout: 60000,
  connectTimeout: 60000
});
const prisma = new PrismaClient({ adapter });

export { prisma }