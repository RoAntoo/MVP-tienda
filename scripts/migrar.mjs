import axios from 'axios';
import * as cheerio from 'cheerio';

// ==========================================
// ⚙️ CONFIGURACIÓN DEL SCRIPT
// ==========================================

// Tu clave secreta de administrador (Cárgala desde variable de entorno)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error("❌ ERROR: La variable de entorno ADMIN_API_KEY no está definida. Uso: ADMIN_API_KEY=tusecreto node scripts/migrar.mjs");
  process.exit(1);
}

// La URL de tu nueva tienda en Heroku (Sin barra al final)
const API_DESTINO = "https://ebookspack-82e1864c7352.herokuapp.com/admin/productos";

// Lista de URLs de Empretienda que quieres migrar
const urlsAMigrar = [
  "https://ebookspack.empretienda.com.ar/ebook/the-empyrean-series",
  // Pega el resto de tus URLs aquí, separadas por comas (y entre comillas)...
];

// ==========================================
// 🛠️ LÓGICA PRINCIPAL
// ==========================================

// Función auxiliar para pausar el script (Delay)
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrarCatalogo() {
  console.log(`🚀 Iniciando migración de ${urlsAMigrar.length} libros...\n`);

  for (let i = 0; i < urlsAMigrar.length; i++) {
    const url = urlsAMigrar[i];
    console.log(`[${i + 1}/${urlsAMigrar.length}] Procesando: ${url}`);

    try {
      // 1. Obtener el HTML de la página de Empretienda
      const respuestaHtml = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(respuestaHtml.data);

      // 2. Extraer los datos usando selectores CSS
      const titulo = $('h1.product-vip__title').text().trim();
      
      // El precio viene en un meta tag (ej: content="6000")
      const precioString = $('meta[property="product:price:amount"]').attr('content');
      const precio = Number(precioString);
      
      // La descripción suele estar en este div
      const descripcion = $('.product-vip__description').first().text().trim();

      // Validación básica
      if (!titulo) {
        throw new Error("No se pudo encontrar el título en esta URL.");
      }
      
      if (!precioString || isNaN(precio) || precio <= 0) {
        throw new Error(`Precio inválido o ausente: '${precioString}'. El precio debe ser un número mayor a 0.`);
      }

      // 3. Preparar el objeto para enviar a tu API
      const nuevoProducto = {
        titulo: titulo,
        precio: precio,
        descripcion: descripcion || "Sin descripción", 
        imagenUrl: "https://placeholder.com/imagen-pendiente.jpg", // Se requiere URL válida por esquema Zod
        categoria: "General", // Categoría por defecto (requerida por nuestra API)
        driveUrl: "https://placeholder.com/drive-pendiente" // Se requiere URL válida por esquema Zod
      };

      // 4. Enviar a Heroku
      await axios.post(API_DESTINO, nuevoProducto, {
        headers: {
          'x-api-key': ADMIN_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ ¡Éxito! Libro subido: "${titulo}"\n`);

    } catch (error) {
      // Manejo de errores: Si falla, mostramos el error pero el script continúa
      console.error(`❌ Error al procesar "${url}":`);
      if (error.response) {
        // Error de la API de Heroku (ej. 401, 500)
        console.error(`   El servidor respondió con código ${error.response.status}:`, error.response.data);
      } else {
        // Error de red, cheerio, etc.
        console.error(`   ${error.message}`);
      }
      console.log(); // Salto de línea
    }

    // 5. El Delay Político (2 segundos de pausa si no es el último elemento)
    if (i < urlsAMigrar.length - 1) {
      await esperar(2000);
    }
  }

  console.log(`🎉 Migración finalizada. Revisa tu panel en Vercel para ver los libros.`);
}

// Arrancar el script
migrarCatalogo();
