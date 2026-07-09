import fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from '../base-datos/prisma-cliente.js';
import { rutas } from './rutas.js';

export const iniciarServidor = async () => {
  const servidor = fastify({ logger: true });

  // Configurar CORS para permitir peticiones desde el Frontend
  await servidor.register(cors, {
    origin: '*', // En producción, cambiar por la URL real del frontend
  });

  servidor.get('/salud', async (peticion, respuesta) => {
    return { estado: 'ok', mensaje: 'Servidor funcionando' };
  });

  // Registrar Rutas de la API
  servidor.register(rutas);

  try {
    await servidor.listen({ port: 3000 });
    console.log('Servidor escuchando en el puerto 3000');
  } catch (error) {
    servidor.log.error(error);
    process.exit(1);
  }
};

// Iniciar el servidor
iniciarServidor();
