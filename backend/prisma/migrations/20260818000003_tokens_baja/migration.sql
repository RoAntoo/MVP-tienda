CREATE TABLE "tokens_baja_suscriptor" (
    "id" TEXT NOT NULL,
    "suscriptorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usadoAt" TIMESTAMP(3),
    "revocadoAt" TIMESTAMP(3),

    CONSTRAINT "tokens_baja_suscriptor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tokens_baja_suscriptor_tokenHash_key" ON "tokens_baja_suscriptor"("tokenHash");
CREATE INDEX "tokens_baja_suscriptor_suscriptorId_usadoAt_revocadoAt_idx"
  ON "tokens_baja_suscriptor"("suscriptorId", "usadoAt", "revocadoAt");

ALTER TABLE "tokens_baja_suscriptor" ADD CONSTRAINT "tokens_baja_suscriptor_suscriptorId_fkey"
  FOREIGN KEY ("suscriptorId") REFERENCES "suscriptores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "tokens_baja_suscriptor" ("id", "suscriptorId", "tokenHash", "creadoAt")
SELECT md5(random()::text || clock_timestamp()::text), "id", "unsubscribeTokenHash", "createdAt"
FROM "suscriptores"
WHERE "unsubscribeTokenHash" IS NOT NULL;

DROP INDEX "suscriptores_unsubscribeTokenHash_key";
ALTER TABLE "suscriptores" DROP COLUMN "unsubscribeTokenHash";
