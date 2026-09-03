export class AdminStore {
  // Paginación de solicitudes
  public solicitudesCurrentPage: number = 1;
  public readonly solicitudesLimit: number = 10;

  // Paginación de órdenes
  public ordenesCurrentPage: number = 1;
  public readonly ordenesLimit: number = 10;
  public ordenesTotal: number = 0;

  // Paginación de productos
  public productosCurrentPage: number = 1;
  public readonly productosLimit: number = 10;
  public productosTotal: number = 0;

  // Datos auxiliares de productos
  public categoriasDisponibles: string[] = [];
  public preciosFrecuentes: { precio: number; count: number }[] = [];

  // Selección de promociones
  public promoProductosDisponibles: any[] = [];
  public readonly promoProductosSeleccionados: Set<string> = new Set();

  // Selección de novedades
  public novedadesProductosDisponibles: any[] = [];
  public novedadesPromocionesDisponibles: any[] = [];
  public readonly novedadesProductosSeleccionados: Set<string> = new Set();
  public readonly novedadesPromocionesSeleccionadas: Set<string> = new Set();

  // Evitar race conditions en tabs
  public currentTabFetchId: number = 0;

  public siguienteFetchId(): number {
    return ++this.currentTabFetchId;
  }
}

export const adminStore = new AdminStore();
