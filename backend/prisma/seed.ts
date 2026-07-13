import 'dotenv/config';
import { prisma } from '../src/infraestructura/base-datos/prisma-cliente.js';

async function main() {
  const productos = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      titulo: 'Cyberpunk Manga: The Awakening',
      precio: 9.99,
      descripcion: 'Adéntrate en una metrópolis de neón donde la humanidad y la tecnología se han fusionado. Este manga hiperdetallado te llevará por los suburbios de Neo-Tokio siguiendo la historia de un hacker renegado que descubre un secreto corporativo letal. Incluye 150 páginas a todo color y material conceptual exclusivo.',
      categoria: 'Manga',
      imagenUrl: 'https://placehold.co/400x500/14141e/ff2a85?text=Cyb+Manga',
      driveUrl: 'https://drive.google.com/file/d/ejemplo-manga-1',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      titulo: 'Advanced Web Hacking Guide',
      precio: 14.99,
      descripcion: 'La guía definitiva para entender las vulnerabilidades web modernas. Desde XSS y CSRF hasta inyecciones NoSQL y desbordamientos de buffer en WebAssembly. Escrito por expertos en ciberseguridad, este libro digital incluye ejercicios prácticos, scripts de prueba en Python y casos de estudio reales desclasificados.',
      categoria: 'Programación',
      imagenUrl: 'https://placehold.co/400x500/14141e/ff2a85?text=Web+Hacking',
      driveUrl: 'https://drive.google.com/file/d/ejemplo-libro-2',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      titulo: 'Neon Nights (Artbook Digital)',
      precio: 19.99,
      descripcion: 'Una asombrosa colección de arte digital curada por artistas de la subcultura Synthwave y Cyberpunk. Más de 200 ilustraciones en resolución 4K ideales para fondos de pantalla o estudio de diseño de interfaces futuristas. Archivo descargable sin DRM en formato PDF interactivo.',
      categoria: 'Arte',
      imagenUrl: 'https://placehold.co/400x500/14141e/ff2a85?text=Neon+Nights',
      driveUrl: 'https://drive.google.com/file/d/ejemplo-artbook-3',
    }
  ];

  for (const p of productos) {
    const producto = await prisma.producto.upsert({
      where: { id: p.id },
      update: {
        titulo: p.titulo,
        precio: p.precio,
        categoria: p.categoria,
        descripcion: p.descripcion,
        imagenUrl: p.imagenUrl,
        driveUrl: p.driveUrl,
      },
      create: {
        id: p.id,
        titulo: p.titulo,
        precio: p.precio,
        categoria: p.categoria,
        descripcion: p.descripcion,
        imagenUrl: p.imagenUrl,
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
