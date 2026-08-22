import * as crypto from 'crypto';

export function generarTokenAprobacion(ordenId: string, secretKey: string): string {
  if (!secretKey) {
    throw new Error('TOKEN_SIGNING_SECRET es requerido para generar tokens.');
  }
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  const payload = `${ordenId}:${expiry}`;
  const hmac = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function validarTokenAprobacion(token: string, ordenId: string, secretKey: string): boolean {
  if (!token || !token.includes(':') || !secretKey) return false;
  
  const partes = token.split(':');
  if (partes.length !== 3) return false;

  const [tokenId, expiryStr, hmac] = partes;
  if (tokenId !== ordenId) return false;
  if (!/^\d+$/.test(expiryStr) || !/^[a-f0-9]{64}$/i.test(hmac)) return false;
  
  const expiry = Number(expiryStr);
  if (!Number.isSafeInteger(expiry) || Date.now() >= expiry) return false;

  const expectedHmac = crypto.createHmac('sha256', secretKey).update(`${tokenId}:${expiryStr}`).digest();
  const receivedHmac = Buffer.from(hmac, 'hex');
  
  // Safe comparison
  return receivedHmac.length === expectedHmac.length
    && crypto.timingSafeEqual(receivedHmac, expectedHmac);
}
