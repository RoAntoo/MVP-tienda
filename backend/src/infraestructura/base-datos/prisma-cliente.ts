import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

const pool = new Pool({ connectionString: databaseUrl });
pool.on('error', (err) => console.error('Error inesperado en cliente de BD', err));

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
