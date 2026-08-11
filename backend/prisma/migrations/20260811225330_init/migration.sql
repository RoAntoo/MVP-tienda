-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "precio" DECIMAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'General',
    "imagen_url" TEXT NOT NULL,
    "drive_url" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_email" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE'
);

-- CreateTable
CREATE TABLE "solicitudes_libros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email_cliente" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotificacionOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_OrdenProductos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OrdenProductos_A_fkey" FOREIGN KEY ("A") REFERENCES "ordenes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OrdenProductos_B_fkey" FOREIGN KEY ("B") REFERENCES "productos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrdenProductos_AB_unique" ON "_OrdenProductos"("A", "B");

-- CreateIndex
CREATE INDEX "_OrdenProductos_B_index" ON "_OrdenProductos"("B");
