import { DatosActualizarPromocion, DatosCrearPromocion, RepositorioPromociones } from '../../dominio/repositorios/repositorio-promociones.js';
import { Promocion } from '../../dominio/entidades/promocion.js';

export class GestionarPromocionesUseCase {
  constructor(private repositorioPromociones: RepositorioPromociones) {}

  async listar(): Promise<Promocion[]> {
    return this.repositorioPromociones.obtenerTodas();
  }

  async crear(datos: DatosCrearPromocion): Promise<Promocion> {
    this.validarDatos(datos.nombre, datos.tipo, datos.valor, datos.productoIds);
    if (this.estaVigente(datos.fechaFin ?? null)) {
      await this.validarDisponibilidad(datos.productoIds);
    }
    return this.repositorioPromociones.crear(datos);
  }

  async actualizar(id: string, datos: DatosActualizarPromocion): Promise<Promocion> {
    const actual = await this.repositorioPromociones.obtenerPorId(id);
    if (!actual) throw new Error('Promoción no encontrada');
    const final = {
      nombre: datos.nombre ?? actual.nombre,
      tipo: datos.tipo ?? actual.tipo,
      valor: datos.valor ?? actual.valor,
      activa: datos.activa ?? actual.activa,
      productoIds: datos.productoIds ?? actual.productoIds,
      fechaFin: datos.fechaFin !== undefined ? datos.fechaFin : actual.fechaFin,
    };
    this.validarDatos(final.nombre, final.tipo, final.valor, final.productoIds);
    if (final.activa && this.estaVigente(final.fechaFin)) {
      await this.validarDisponibilidad(final.productoIds, id);
    }
    return this.repositorioPromociones.actualizar(id, final);
  }

  async eliminar(id: string): Promise<void> {
    return this.repositorioPromociones.eliminar(id);
  }

  private validarDatos(nombre: string, tipo: string, valor: number, productoIds: string[]) {
    if (!nombre.trim()) throw new Error('El nombre de la promoción es obligatorio');
    if (valor <= 0) throw new Error('El valor debe ser mayor a cero');
    if (tipo === 'PORCENTAJE' && valor > 100) throw new Error('El porcentaje no puede superar 100');
    if (productoIds.length === 0) throw new Error('Debe seleccionar al menos un producto');
  }

  private async validarDisponibilidad(productoIds: string[], excluirId?: string) {
    const ids = [...new Set(productoIds)];
    const ocupados = await this.repositorioPromociones.obtenerProductosConPromocionActiva(ids, excluirId);
    if (ocupados.length > 0) throw new Error(`Ya tienen una promoción activa: ${ocupados.join(', ')}`);
  }

  private estaVigente(fechaFin: Date | null) {
    return !fechaFin || fechaFin >= new Date();
  }
}
