import 'dotenv/config';
import { prisma } from '../src/infraestructura/base-datos/prisma-cliente.js';

async function main() {
  const productos = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      titulo: 'Cyberpunk Manga: The Awakening',
      precio: 9.99,
      driveUrl: 'https://drive.google.com/ejemplo-manga',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      titulo: 'Advanced Web Hacking Guide',
      precio: 14.99,
      driveUrl: 'https://drive.google.com/ejemplo-hacking',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      titulo: 'Neon Nights (Artbook Digital)',
      precio: 19.99,
      driveUrl: 'https://drive.google.com/ejemplo-artbook',
    }
  ];

  for (const p of productos) {
    const producto = await prisma.producto.upsert({
      where: { id: p.id },
      update: {
        titulo: p.titulo,
        precio: p.precio,
        driveUrl: p.driveUrl,
      },
      create: {
        id: p.id,
        titulo: p.titulo,
        precio: p.precio,
        driveUrl: p.driveUrl,
      },
    });
    console.log(`✅ Producto asegurado: ${producto.titulo}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
