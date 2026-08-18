export interface RepositorioSuscriptores {
  suscribir(email: string): Promise<void>;
}
