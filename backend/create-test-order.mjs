import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const prisma = new PrismaClient();
const id = randomUUID();
const prod = await prisma.producto.findFirst();
if (!prod) { console.log('NO PRODUCTS'); process.exit(1); }
const orden = await prisma.orden.create({
  data: { id, emailCliente: 'test-del@example.com', total: 9.99, estado: 'PENDIENTE', productos: { connect: { id: prod.id } } },
  include: { productos: true },
});
console.log('CREATED', orden.id);
await prisma.$disconnect();
