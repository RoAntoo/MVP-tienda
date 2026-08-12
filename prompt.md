Quiero que rediseñes y mejores la interfaz actual de mi proyecto EbooksPack.

CONTEXTO DEL PROYECTO

EbooksPack es una tienda online de ebooks vendidos en formato EPUB. El sitio ya está funcional y desplegado. No quiero rehacer la aplicación desde cero ni modificar innecesariamente la lógica existente. El objetivo principal de esta tarea es mejorar radicalmente la experiencia visual, la jerarquía de información y la percepción de calidad del sitio.

La interfaz actual utiliza una estética oscura con negro, cian y rosa/magenta, con cierta inspiración cyberpunk. QUIERO CONSERVAR ESA IDENTIDAD VISUAL, pero transformarla desde una apariencia de "landing page cyberpunk genérica" hacia una estética de "librería digital premium / cyberpunk editorial".

IMPORTANTE:

* Antes de modificar código, inspeccioná la estructura actual del proyecto, sus componentes, estilos y funcionalidades.
* Identificá qué partes de la interfaz ya funcionan correctamente y conservá su comportamiento.
* No elimines funcionalidades existentes.
* No reemplaces lógica de negocio, autenticación, carrito, consultas, APIs, rutas o integración con backend salvo que sea estrictamente necesario para el rediseño.
* Priorizá reutilizar componentes existentes y refactorizar estilos antes que duplicar código.
* Usá el skill UI/UX Pro Max para analizar y establecer un Design System coherente antes de implementar el rediseño.
* Revisá la interfaz completa, no solamente el hero.
* El resultado debe sentirse como un producto real listo para producción, no como una plantilla generada por IA.

OBJETIVO VISUAL

Quiero una interfaz:

* moderna
* premium
* tecnológica
* editorial
* elegante
* oscura
* fácil de navegar
* visualmente atractiva sin sentirse sobrecargada

Mantené como identidad principal:

* fondo oscuro/negro
* cian como color de interacción y detalles
* magenta/rosa como color de acento
* estética tecnológica sutil
* líneas, grids y detalles futuristas usados con moderación

EVITÁ:

* exceso de gradientes
* exceso de glow
* demasiadas sombras
* glassmorphism exagerado
* animaciones innecesarias
* interfaces que parezcan dashboards administrativos
* componentes genéricos de Tailwind sin personalidad
* saturar toda la pantalla de elementos decorativos

PRINCIPIOS DE DISEÑO

La prioridad visual debe ser:

1. Navegación
2. Búsqueda
3. Descubrimiento de libros
4. Portadas
5. Información del libro
6. Compra / carrito
7. Elementos secundarios

La interfaz debe hacer que el usuario entienda inmediatamente:

* qué vende EbooksPack
* cómo encontrar un libro
* cómo explorar categorías
* qué libros son destacados
* cuánto cuestan
* cómo comprarlos

HEADER

Rediseñá el header para que tenga una navegación más clara.

Actualmente el logo está a la izquierda y "Solicitar libro/s" y "Carrito" tienen demasiado peso visual.

Proponé una estructura similar a:

EbooksPack

Inicio | Explorar | Géneros | Ofertas

```
                                    Buscar | Carrito
```

"Solicitar libro/s" debe seguir disponible, pero como acción secundaria y no competir visualmente con el carrito.

El header debe funcionar correctamente en desktop y mobile.

HERO

Reducí considerablemente el espacio vertical ocupado por el hero actual.

Actualmente el hero ocupa demasiado espacio para el valor que aporta.

Reemplazalo por una sección más compacta y orientada a conversión.

La idea conceptual es:

"Tu biblioteca digital, sin vueltas."

"Mangas, novelas y libros técnicos en formato EPUB. Compralos y empezá a leer al instante."

Debajo debe existir una barra de búsqueda grande y prominente con placeholder similar a:

"Buscar por título, autor, género..."

La búsqueda debe tener una posición visual mucho más importante que actualmente.

El fondo/grid cyberpunk puede conservarse, pero debe ser mucho más sutil para no competir con el contenido.

CATÁLOGO Y DESCUBRIMIENTO

La sección de libros debe convertirse en el elemento protagonista de la homepage.

Organizá el catálogo en secciones claras, por ejemplo:

* Más vendidos
* Recién añadidos
* Ofertas
* Explorar por género

Podés adaptar los nombres a la estructura existente del proyecto.

Cada sección debe tener una jerarquía clara y un enlace como "Ver todos →" cuando corresponda.

CATEGORÍAS

Actualmente las categorías se muestran como tags estilo:

[ THRILLER ] [ DARK ROMANCE ] [ SUSPENSO ] ...

Rediseñalas para que parezcan categorías de una librería y no filtros técnicos.

Deben seguir siendo fáciles de recorrer horizontalmente si hay muchas categorías, pero con mejor jerarquía visual, estados hover y selección claramente diferenciados.

BOOK CARDS

Las tarjetas de libros necesitan una mejora importante.

La portada debe ser el elemento visual principal.

Cada card debería comunicar claramente:

* portada
* título
* autor
* género o metadata relevante
* precio
* formato EPUB
* acción de compra o añadir al carrito

Busco una estructura visual similar a:

PORTADA

Título
Autor
Metadata

EPUB
$X.XX                         Añadir al carrito

Las cards deben tener:

* proporciones consistentes
* buen espaciado
* bordes sutiles
* hover elegante
* transición suave
* elevación visual moderada
* excelente legibilidad

No quiero cards excesivamente grandes ni llenas de elementos.

Al hacer hover, podés mostrar acciones adicionales como "Ver detalles", pero sin transformar la card en una animación exagerada.

Los covers deben tener prioridad visual sobre el texto.

PRECIO Y CTA

El precio debe ser fácilmente visible.

El botón de añadir al carrito debe sentirse como una acción principal, pero sin destruir la estética editorial.

Diferenciá visualmente:

* compra
* ver detalles
* wishlist/favoritos si ya existe
* otras acciones secundarias

SECCIÓN DE CONFIANZA

Agregá, solamente si encaja con la arquitectura actual, una sección breve que comunique beneficios del servicio.

Ejemplo conceptual:

Descarga instantánea
Formato EPUB
Sin DRM
Compra segura

No quiero una sección gigante. Debe reforzar la confianza en la tienda.

JERARQUÍA Y ESPACIADO

Revisá todo el sistema visual:

* tamaños de títulos
* subtítulos
* espaciado vertical
* ancho máximo del contenido
* separación entre secciones
* alineación
* contraste
* tamaños de botones
* estados hover/focus/active

Actualmente algunas zonas tienen demasiado espacio vacío mientras que otras concentran demasiados elementos.

Buscá una composición más equilibrada y profesional.

TIPOGRAFÍA

Seleccioná una combinación tipográfica más refinada y coherente con una tienda editorial tecnológica.

Debe existir una clara diferencia entre:

* branding
* headings
* títulos de libros
* metadata
* body text
* precios
* botones

No uses demasiadas fuentes.

RESPONSIVE

La interfaz debe funcionar correctamente en:

* desktop
* laptop
* tablet
* mobile

Especialmente revisá:

* header
* navegación
* búsqueda
* grid de libros
* categorías
* cards
* carrito
* hero

En mobile no quiero simplemente "encoger" la versión desktop. Adaptá realmente la jerarquía y distribución.

ACCESIBILIDAD

Asegurate de que:

* exista contraste suficiente
* los botones sean claramente identificables
* los estados focus sean visibles
* los textos no sean demasiado pequeños
* las imágenes tengan alt text cuando corresponda
* la navegación por teclado siga funcionando
* no dependamos exclusivamente del color para comunicar estados

ANIMACIONES

Usá animaciones sutiles y únicamente cuando aporten a la experiencia:

* hover
* entrada de elementos
* transiciones
* feedback de acciones

Evita animaciones constantes, parallax innecesario o efectos que distraigan de las portadas.

IMPLEMENTACIÓN

Quiero que primero hagas una evaluación de la interfaz actual y determines:

1. Qué componentes existentes pueden reutilizarse.
2. Qué componentes necesitan refactor.
3. Qué componentes nuevos hacen falta.
4. Qué cambios de Design System son necesarios.

Después implementá el rediseño directamente sobre el proyecto.

IMPORTANTE: no quiero solamente recomendaciones, mockups o una explicación. Quiero que modifiques el código del proyecto y dejes la interfaz funcionando.

Antes de terminar:

* comprobá que la aplicación compile
* verificá que no hayas roto funcionalidades existentes
* revisá errores de consola
* revisá responsive
* verificá que los botones y enlaces existentes sigan funcionando
* mantené consistencia visual entre las diferentes páginas

RESULTADO ESPERADO

El usuario debería entrar a EbooksPack y percibir inmediatamente:

"Esto es tu librería digital."

No quiero que parezca un dashboard.
No quiero que parezca una landing tecnológica genérica.
No quiero perder la estética oscura/cyberpunk actual.

Quiero una evolución de la interfaz existente hacia una experiencia de compra de ebooks premium, con las portadas y el descubrimiento de libros como protagonistas.

Tomá la captura de pantalla proporcionada de la interfaz actual como referencia visual del estado inicial y compará mentalmente el resultado final contra ella para asegurarte de que la mejora sea evidente.
