import { execSync } from 'child_process';

const migrations = [
  '20260816000000_init',
  '20260817000000_promociones',
  '20260818000000_suscriptores',
  '20260818000001_novedades',
  '20260818000002_seguridad_envios',
  '20260818000003_tokens_baja'
];

console.log('Resolviendo migraciones base para Heroku...');

for (const m of migrations) {
  try {
    console.log(`Marcando ${m} como aplicada...`);
    execSync(`npx prisma migrate resolve --applied ${m}`, { cwd: './backend', stdio: 'inherit' });
  } catch (e) {
    console.log(`La migración ${m} ya estaba aplicada o falló la resolución. Continuando...`);
  }
}
