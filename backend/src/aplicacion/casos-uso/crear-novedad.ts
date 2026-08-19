import { ContenidoNovedad, TipoNovedad } from '../../dominio/entidades/novedad.js';
import { RepositorioNovedades } from '../../dominio/repositorios/repositorio-novedades.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';
import { RepositorioPromociones } from '../../dominio/repositorios/repositorio-promociones.js';
import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';

export interface InputCrearNovedad {
  tipo: TipoNovedad;
  mensaje: string;
  productoIds: string[];
  promocionIds: string[];
}

export class CrearNovedadUseCase {
  constructor(
    private repositorioNovedades: RepositorioNovedades,
    private repositorioProductos: RepositorioProductos,
    private repositorioPromociones: RepositorioPromociones,
    private repositorioSuscriptores: RepositorioSuscriptores,
  ) {}

  async ejecutar(input: InputCrearNovedad) {
    const mensaje = input.mensaje.trim();
    if (!mensaje) throw new Error('El mensaje de la novedad es obligatorio');

    const productoIds = [...new Set(input.productoIds)];
    const promocionIds = [...new Set(input.promocionIds)];
    let contenido: ContenidoNovedad;
    let asunto: string;

    if (input.tipo === 'CATALOGO') {
      if (productoIds.length === 0) throw new Error('Seleccioná al menos un libro');
      if (promocionIds.length > 0) throw new Error('Una novedad de catálogo no puede incluir promociones');

      const productos = await this.repositorioProductos.obtenerPorIds(productoIds);
      if (productos.length !== productoIds.length) throw new Error('Uno o más libros seleccionados no existen');

      contenido = {
        productos: productos.map(producto => ({
          titulo: producto.titulo,
          precio: Number(producto.precio),
          categoria: producto.categoria,
          imagenUrl: producto.imagenUrl,
        })),
      };
      asunto = 'Nuevas lecturas: libros recién llegados a EbooksPack';
    } else {
      if (promocionIds.length === 0) throw new Error('Seleccioná al menos una promoción');
      if (productoIds.length > 0) throw new Error('Una novedad de promoción no puede incluir libros');

      const promociones = await Promise.all(promocionIds.map(id => this.repositorioPromociones.obtenerPorId(id)));
      const promocionesValidas = promociones.filter((promocion): promocion is NonNullable<typeof promocion> => Boolean(promocion));
      if (promocionesValidas.length !== promocionIds.length) throw new Error('Una o más promociones seleccionadas no existen');

      const ahora = new Date();
      if (promocionesValidas.some(promocion => !promocion.activa || promocion.fechaInicio > ahora || (promocion.fechaFin && promocion.fechaFin < ahora))) {
        throw new Error('Solo se pueden enviar promociones activas y vigentes');
      }

      contenido = {
        promociones: promocionesValidas.map(promocion => ({
          nombre: promocion.nombre,
          tipo: promocion.tipo,
          valor: promocion.valor,
          fechaFin: promocion.fechaFin,
        })),
      };
      asunto = 'Nuevas promociones en EbooksPack';
    }

    const destinatarios = await this.repositorioSuscriptores.obtenerActivos();
    if (destinatarios.length === 0) throw new Error('No hay suscriptores activos');

    return this.repositorioNovedades.crear({
      tipo: input.tipo,
      asunto,
      mensaje,
      contenido,
      destinatarios,
    });
  }
}
