-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'General',
    "imagen_url" TEXT NOT NULL,
    "drive_url" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_libros" (
    "id" TEXT NOT NULL,
    "email_cliente" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionOutbox" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'NUEVA_SOLICITUD',
    "payload" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificacionOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrdenProductos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrdenProductos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrdenProductos_B_index" ON "_OrdenProductos"("B");

-- AddForeignKey
ALTER TABLE "NotificacionOutbox" ADD CONSTRAINT "NotificacionOutbox_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_libros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrdenProductos" ADD CONSTRAINT "_OrdenProductos_A_fkey" FOREIGN KEY ("A") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrdenProductos" ADD CONSTRAINT "_OrdenProductos_B_fkey" FOREIGN KEY ("B") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
