CREATE TABLE "campanias_novedad" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadaAt" TIMESTAMP(3),

    CONSTRAINT "campanias_novedad_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "envios_novedad" (
    "id" TEXT NOT NULL,
    "campaniaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "enviadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "envios_novedad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "envios_novedad_campaniaId_email_key" ON "envios_novedad"("campaniaId", "email");
CREATE INDEX "envios_novedad_estado_lockedUntil_idx" ON "envios_novedad"("estado", "lockedUntil");

ALTER TABLE "envios_novedad" ADD CONSTRAINT "envios_novedad_campaniaId_fkey"
  FOREIGN KEY ("campaniaId") REFERENCES "campanias_novedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
