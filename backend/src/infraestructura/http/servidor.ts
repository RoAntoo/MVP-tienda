import fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from '../base-datos/prisma-cliente.js';
import { rutas } from './rutas.js';

export const iniciarServidor = async () => {
  const servidor = fastify({ logger: true });

  // Configurar CORS para permitir peticiones desde el Frontend
  await servidor.register(cors, {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  servidor.get('/salud', async (peticion, respuesta) => {
    return { estado: 'ok', mensaje: 'Servidor funcionando' };
  });

  // Registrar Rutas de la API
  servidor.register(rutas);

  try {
    const puerto = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await servidor.listen({ port: puerto, host: '0.0.0.0' });
    console.log(`Servidor escuchando en el puerto ${puerto}`);
  } catch (error) {
    servidor.log.error(error);
    process.exit(1);
  }
};

// Iniciar el servidor
iniciarServidor();
