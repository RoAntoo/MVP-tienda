import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';
import { RepositorioProductos } from '../../dominio/repositorios/repositorio-productos.js';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Orden } from '../../dominio/entidades/orden.js';

export interface SolicitudAprobarOrden {
  ordenId: string;
}

export class AprobarOrdenUseCase {
  constructor(
    private repositorioOrdenes: RepositorioOrdenes,
    private repositorioProductos: RepositorioProductos,
    private servicioEmail: ServicioEmail
  ) { }

  async ejecutar(solicitud: SolicitudAprobarOrden): Promise<{ orden: Orden; yaAprobada: boolean }> {
    // Intentar actualizar atómicamente la orden (de PENDIENTE a APROBADO)
    const resultado = await this.repositorioOrdenes.actualizarEstado(solicitud.ordenId, 'PENDIENTE', 'APROBADO');

    if (!resultado) {
      throw new Error(`La orden con id ${solicitud.ordenId} no existe.`);
    }

    if (resultado.modificada) {
      const idsRequeridos = (resultado.orden.productos || []).map(p => p.id);
      
      if (idsRequeridos.length === 0) {
        console.error(`La orden ${resultado.orden.id} no tiene productos asociados.`);
      } else {
        const productosAComprar = await this.repositorioProductos.obtenerPorIds(idsRequeridos);
        
        if (productosAComprar.length !== idsRequeridos.length) {
          console.error(`Faltan productos en la base de datos para la orden ${resultado.orden.id}. Se abortó el envío de links.`);
        } else {
          this.servicioEmail.enviarLinksDescarga(resultado.orden.emailCliente, productosAComprar).catch((err) => {
            console.error('Error enviando links de descarga (asíncrono):', err);
          });
        }
      }
    }

    return {
      orden: resultado.orden,
      yaAprobada: !resultado.modificada, // Si no fue modificada, es porque ya estaba APROBADA (o despachada)
    };
  }
}
