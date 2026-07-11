import 'dotenv/config';
import { prisma } from '../src/infraestructura/base-datos/prisma-cliente.js';

async function main() {
  const PRODUCTO_ID = '00000000-0000-0000-0000-000000000001';
  
  const producto = await prisma.producto.upsert({
    where: { id: PRODUCTO_ID },
    update: {},
    create: {
      id: PRODUCTO_ID,
      titulo: 'Libro de Prueba MVP',
      precio: 9.99,
      driveUrl: 'https://drive.google.com/ejemplo-libro',
    },
  });

  console.log(`[SEED] Producto de prueba asegurado! ID: ${producto.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
