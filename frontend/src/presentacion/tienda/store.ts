import type { Producto } from '../../dominio/entidades/producto.ts';

export interface TiendaState {
  productos: Producto[];
  categorias: string[];
  categoriasSeleccionadas: Set<string>;
  busqueda: string;
  paginaActual: number;
  limitePorPagina: number;
  totalProductos: number;
  nombresPromocionesActivas: string[];
  promocionesCargadas: boolean;
  soloPromociones: boolean;
  carrito: Producto[];
}

type Listener = (state: Readonly<TiendaState>) => void;

class TiendaStore {
  private state: TiendaState = {
    productos: [],
    categorias: [],
    categoriasSeleccionadas: new Set<string>(),
    busqueda: '',
    paginaActual: 1,
    limitePorPagina: 10,
    totalProductos: 0,
    nombresPromocionesActivas: [],
    promocionesCargadas: false,
    soloPromociones: false,
    carrito: [],
  };

  private listeners: Set<Listener> = new Set();

  public getState(): Readonly<TiendaState> {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error en listener de TiendaStore:', err);
      }
    });
  }

  public setProductos(productos: Producto[], total: number): void {
    this.state.productos = productos;
    this.state.totalProductos = total;
    this.notify();
  }

  public setCategorias(categorias: string[]): void {
    this.state.categorias = categorias;
    this.notify();
  }

  public toggleCategoria(categoria: string): void {
    if (this.state.categoriasSeleccionadas.has(categoria)) {
      this.state.categoriasSeleccionadas.delete(categoria);
    } else {
      this.state.categoriasSeleccionadas.add(categoria);
    }
    this.state.paginaActual = 1;
    this.notify();
  }

  public setBusqueda(busqueda: string): void {
    this.state.busqueda = busqueda;
    this.state.paginaActual = 1;
    this.notify();
  }

  public setPaginaActual(pagina: number): void {
    this.state.paginaActual = pagina;
    this.notify();
  }

  public setSoloPromociones(solo: boolean): void {
    this.state.soloPromociones = solo;
    this.state.paginaActual = 1;
    this.notify();
  }

  public setPromocionesActivas(nombres: string[]): void {
    this.state.nombresPromocionesActivas = nombres;
    this.state.promocionesCargadas = true;
    this.notify();
  }

  public setCarrito(carrito: Producto[]): void {
    this.state.carrito = carrito;
    this.notify();
  }

  public vaciarCarrito(): void {
    this.state.carrito = [];
    this.notify();
  }
}

export const tiendaStore = new TiendaStore();
