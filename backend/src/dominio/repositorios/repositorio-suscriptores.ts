export interface RepositorioSuscriptores {
  suscribir(email: string): Promise<void>;
  obtenerActivos(): Promise<string[]>;
  generarTokenBaja(email: string, secret: string): Promise<string>;
  desactivarPorToken(token: string, secret: string): Promise<boolean>;
}
