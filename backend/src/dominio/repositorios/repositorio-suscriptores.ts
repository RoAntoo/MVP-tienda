export interface RepositorioSuscriptores {
  suscribir(email: string): Promise<void>;
  obtenerActivos(): Promise<string[]>;
  desactivar(email: string): Promise<void>;
}
