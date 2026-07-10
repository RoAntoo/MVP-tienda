import { RepositorioOrdenes } from '../../dominio/repositorios/repositorio-ordenes.js';

export interface SolicitudDespacharProducto {
  ordenId: string;
}

export class DespacharProductoUseCase {
  constructor(private repositorioOrdenes: RepositorioOrdenes) {}

  async ejecutar(solicitud: SolicitudDespacharProducto): Promise<void> {
    const orden = await this.repositorioOrdenes.obtenerPorId(solicitud.ordenId);

    if (!orden) {
      throw new Error(`La orden con id ${solicitud.ordenId} no existe.`);
    }

    if (orden.estado === 'DESPACHADO') {
      return; // Ya se despachó previamente, ignorar para evitar duplicados
    }

    if (orden.estado !== 'APROBADO') {
      throw new Error(`No se puede despachar la orden ${solicitud.ordenId} porque su estado es ${orden.estado}.`);
    }

    const productos = orden.productos || [];

    if (productos.length === 0) {
      throw new Error(`La orden no tiene productos asociados.`);
    }

    // Actualizar atómicamente a DESPACHADO
    const resultadoActualizacion = await this.repositorioOrdenes.actualizarEstado(orden.id, 'DESPACHADO');
    
    if (resultadoActualizacion?.modificada) {
      console.log(`========================================`);
      console.log(`[SIMULACION - CORREO DE ENTREGA DE PRODUCTOS]`);
      console.log(`Para: ${orden.emailCliente}`);
      console.log(`Asunto: ¡Tu pago fue aprobado! Aquí están tus compras`);
      console.log(`Mensaje: Hola! Confirmamos la recepción de tu pago. A continuación tienes los enlaces para descargar tus libros:`);
      
      productos.forEach((p, index) => {
        console.log(`${index + 1}. ${p.titulo} -> ${p.driveUrl}`);
      });
      
      console.log(`¡Disfruta tu lectura!`);
      console.log(`========================================`);
    }
  }
}
