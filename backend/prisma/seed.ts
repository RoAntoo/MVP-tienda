import 'dotenv/config';
import { prisma } from '../src/infraestructura/base-datos/prisma-cliente.js';

async function main() {
  const producto = await prisma.producto.create({
    data: {
      titulo: 'Libro de Prueba MVP',
      precio: 9.99,
      driveUrl: 'https://drive.google.com/ejemplo-libro',
    },
  });

  console.log(`Producto de prueba creado! ID: ${producto.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
