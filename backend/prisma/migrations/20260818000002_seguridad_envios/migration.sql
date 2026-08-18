ALTER TABLE "suscriptores" ADD COLUMN "unsubscribeTokenHash" TEXT;
ALTER TABLE "envios_novedad" ADD COLUMN "leaseToken" TEXT;
ALTER TABLE "envios_novedad" ADD COLUMN "resultadoAceptadoAt" TIMESTAMP(3);
ALTER TABLE "envios_novedad" ADD COLUMN "referenciaEnvio" TEXT;

CREATE UNIQUE INDEX "suscriptores_unsubscribeTokenHash_key"
  ON "suscriptores"("unsubscribeTokenHash");
