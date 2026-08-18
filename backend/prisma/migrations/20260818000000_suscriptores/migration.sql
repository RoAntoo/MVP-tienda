CREATE TABLE "suscriptores" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscriptores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suscriptores_email_key" ON "suscriptores"("email");
