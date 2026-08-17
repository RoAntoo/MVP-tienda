import { DatosActualizarPromocion, DatosCrearPromocion, RepositorioPromociones } from '../../dominio/repositorios/repositorio-promociones.js';
import { Promocion } from '../../dominio/entidades/promocion.js';

export class GestionarPromocionesUseCase {
  constructor(private repositorioPromociones: RepositorioPromociones) {}

  async listar(): Promise<Promocion[]> {
    return this.repositorioPromociones.obtenerTodas();
  }

  async crear(datos: DatosCrearPromocion): Promise<Promocion> {
    this.validarDatos(datos.nombre, datos.tipo, datos.valor, datos.productoIds);
    await this.validarDisponibilidad(datos.productoIds);
    return this.repositorioPromociones.crear(datos);
  }

  async actualizar(id: string, datos: DatosActualizarPromocion): Promise<Promocion> {
    if (datos.valor !== undefined && datos.valor <= 0) throw new Error('El valor debe ser mayor a cero');
    if (datos.tipo === 'PORCENTAJE' && datos.valor !== undefined && datos.valor > 100) throw new Error('El porcentaje no puede superar 100');
    let productoIds = datos.productoIds;
    if (datos.activa === true && !productoIds) {
      const actual = await this.repositorioPromociones.obtenerPorId(id);
      if (!actual) throw new Error('Promoción no encontrada');
      productoIds = actual.productoIds;
    }
    if (productoIds) await this.validarDisponibilidad(productoIds, id);
    return this.repositorioPromociones.actualizar(id, datos);
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
}
