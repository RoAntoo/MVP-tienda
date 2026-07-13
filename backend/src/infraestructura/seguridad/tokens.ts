import * as crypto from 'crypto';

export function generarTokenAprobacion(ordenId: string, apiKey: string): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  const payload = `${ordenId}:${expiry}`;
  const hmac = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function validarTokenAprobacion(token: string, ordenId: string, apiKey: string): boolean {
  if (!token || !token.includes(':')) return false;
  
  const [tokenId, expiryStr, hmac] = token.split(':');
  if (tokenId !== ordenId) return false;
  
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  const expectedHmac = crypto.createHmac('sha256', apiKey).update(`${tokenId}:${expiryStr}`).digest('hex');
  
  // Safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  } catch (e) {
    return false;
  }
}
