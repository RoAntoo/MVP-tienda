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

CREATE OR REPLACE FUNCTION validar_exclusividad_promocion(promocion_id TEXT)
RETURNS VOID AS $$
DECLARE
    producto_id TEXT;
BEGIN
    FOR producto_id IN
        SELECT "B" FROM "_PromocionProductos" WHERE "A" = promocion_id ORDER BY "B"
    LOOP
        PERFORM pg_advisory_xact_lock(hashtextextended(producto_id, 0));

        IF EXISTS (
            SELECT 1
            FROM "_PromocionProductos" propia
            JOIN "_PromocionProductos" otra ON otra."B" = propia."B" AND otra."A" <> propia."A"
            JOIN "Promocion" actual ON actual."id" = propia."A"
            JOIN "Promocion" existente ON existente."id" = otra."A"
            WHERE propia."A" = promocion_id
              AND actual."activa"
              AND existente."activa"
              AND actual."fechaInicio" <= COALESCE(existente."fechaFin", 'infinity'::timestamp)
              AND existente."fechaInicio" <= COALESCE(actual."fechaFin", 'infinity'::timestamp)
        ) THEN
            RAISE EXCEPTION 'El producto ya tiene una promoción activa superpuesta';
        END IF;
    END LOOP;
    RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION disparar_validacion_exclusividad_promocion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = '_PromocionProductos' THEN
        PERFORM validar_exclusividad_promocion(NEW."A");
    ELSE
        PERFORM validar_exclusividad_promocion(NEW."id");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "_PromocionProductos" primera_relacion
        JOIN "_PromocionProductos" segunda_relacion
          ON segunda_relacion."B" = primera_relacion."B"
         AND segunda_relacion."A" > primera_relacion."A"
        JOIN "Promocion" primera ON primera."id" = primera_relacion."A"
        JOIN "Promocion" segunda ON segunda."id" = segunda_relacion."A"
        WHERE primera."activa"
          AND segunda."activa"
          AND primera."fechaInicio" <= COALESCE(segunda."fechaFin", 'infinity'::timestamp)
          AND segunda."fechaInicio" <= COALESCE(primera."fechaFin", 'infinity'::timestamp)
    ) THEN
        RAISE EXCEPTION 'Existen promociones activas superpuestas para el mismo producto';
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS "PromocionProductos_exclusividad" ON "_PromocionProductos";
CREATE CONSTRAINT TRIGGER "PromocionProductos_exclusividad"
AFTER INSERT OR UPDATE ON "_PromocionProductos"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION disparar_validacion_exclusividad_promocion();

DROP TRIGGER IF EXISTS "Promocion_exclusividad" ON "Promocion";
CREATE CONSTRAINT TRIGGER "Promocion_exclusividad"
AFTER UPDATE OF "activa", "fechaInicio", "fechaFin" ON "Promocion"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION disparar_validacion_exclusividad_promocion();
