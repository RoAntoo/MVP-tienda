CREATE TABLE "Promocion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promocion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_PromocionProductos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromocionProductos_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_PromocionProductos_B_index" ON "_PromocionProductos"("B");

ALTER TABLE "_PromocionProductos" ADD CONSTRAINT "_PromocionProductos_A_fkey" FOREIGN KEY ("A") REFERENCES "Promocion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PromocionProductos" ADD CONSTRAINT "_PromocionProductos_B_fkey" FOREIGN KEY ("B") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
