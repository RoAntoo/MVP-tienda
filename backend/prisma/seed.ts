import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const producto = await prisma.producto.create({
    data: {
      titulo: 'Libro de Prueba MVP',
      precio: 9.99,
      driveUrl: 'https://drive.google.com/ejemplo-libro',
    },
  });

  console.log(`✅ Producto de prueba creado! ID: ${producto.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
