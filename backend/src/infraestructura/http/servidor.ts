import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { prisma } from '../base-datos/prisma-cliente.js';
import { rutas } from './rutas.js';

export const iniciarServidor = async () => {
  const trustProxyConfig = process.env.TRUST_PROXY
    ? process.env.TRUST_PROXY === 'true'
      ? true
      : process.env.TRUST_PROXY === 'false'
      ? false
      : !isNaN(Number(process.env.TRUST_PROXY))
      ? Number(process.env.TRUST_PROXY)
      : process.env.TRUST_PROXY.includes(',')
      ? process.env.TRUST_PROXY.split(',').map((ip) => ip.trim())
      : process.env.TRUST_PROXY
    // No confiar en X-Forwarded-For salvo que el proxy se configure explícitamente.
    : false;

  const servidor = fastify({
    trustProxy: trustProxyConfig,
    bodyLimit: 128 * 1024,
    logger: {
      // Nunca loguear cabeceras de autenticación
      redact: {
        paths: ['req.headers["x-api-key"]', 'req.headers.authorization'],
        censor: '[REDACTADO]',
      },
      serializers: {
        // No loguear el query string: puede contener tokens de enlaces mágicos
        req: (req: any) => ({
          method: req.method,
          url: (req.url || '').split('?')[0],
          host: req.headers?.host,
          remoteAddress: req.ip,
        }),
      },
    },
  });

  servidor.addHook('onSend', async (peticion, respuesta, payload) => {
    if (peticion.url.split('?')[0].startsWith('/admin')) {
      respuesta.header('Cache-Control', 'no-store');
    }
    return payload;
  });

  // Headers de seguridad. La CSP permite inline porque las páginas de
  // confirmación de enlaces mágicos usan <script> y <style> inline.
  await servidor.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'unsafe-inline'"],
        styleSrc: ["'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // La API es consumida desde el frontend (otro origen)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Rate limiting global. Los endpoints sensibles tienen límites más
  // estrictos definidos por ruta en rutas.ts
  await servidor.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_peticion: any, contexto: any) => ({
      statusCode: 429,
      error: `Demasiadas peticiones. Intenta de nuevo en ${contexto.after}.`,
    }),
  });

  // Configurar CORS: solo el frontend conocido (sin fallback abierto '*')
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = frontendUrl.split(',').map((url) => url.trim()).filter(Boolean);
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    throw new Error("FRONTEND_URL debe contener al menos un origen explícito y no puede ser '*'.");
  }
  if (allowedOrigins.some((url) => {
    try {
      const protocolo = new URL(url).protocol;
      return protocolo !== 'http:' && protocolo !== 'https:';
    } catch {
      return true;
    }
  })) {
    throw new Error('FRONTEND_URL contiene un origen inválido.');
  }
  if (process.env.NODE_ENV === 'production' && allowedOrigins.some((url) => new URL(url).protocol !== 'https:')) {
    throw new Error('FRONTEND_URL debe usar HTTPS en producción.');
  }
  await servidor.register(cors, {
    origin: allowedOrigins,
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
