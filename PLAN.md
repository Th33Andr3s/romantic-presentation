# PLAN DE DESARROLLO — "Para mi gran amor"

Presentación interactiva tipo juego para Valery, hecha por Andrés. Se publica en GitHub Pages
(`https://th33andr3s.github.io/romantic-presentation/`).

Este documento es la especificación completa. Está pensado para que un agente (Sonnet) lo ejecute
**fase por fase, en orden, con un commit por fase**. No inventes flujo ni textos: todo está aquí.
Si algo no está definido, elige la opción más simple que cumpla los criterios de aceptación.

---

## 0. Decisiones ya tomadas (no discutir)

| Tema | Decisión |
|---|---|
| Stack | HTML + CSS + JS puros (ES modules). Sin bundler, sin framework, sin npm en el proyecto. |
| Libro 3D | Librería **StPageFlip** por CDN (`page-flip`). |
| Galaxia, corazón, volcán, estrellas | **Canvas 2D nativo**. Sin Three.js. |
| Rompecabezas | Sí. Foto de la cascada (`assets/img/puzzle.webp`), cuadrícula 3x3, mecánica "tocar y tocar" para intercambiar. Bloquea el avance hasta armarlo, con botón de rescate a los 90 s. **La cascada aparece solo aquí**: no existe como página normal del libro. |
| Orden de fotos | `photo-01`, `photo-03`, `photo-04`, `photo-05`, **rompecabezas (la cascada)**, `photo-06` a `photo-10`. No existe `photo-02.webp`; la cascada es `puzzle.webp`. |
| Clave | Fecha **05 / 02 / 2002** (5 de febrero de 2002). Se digita en tres cajas DD / MM / AAAA. |
| Prioridad de pantalla | **Celular primero** (390x844 y 360x800). Escritorio debe verse bien, pero se prueba después. |
| Idioma | Código, nombres de archivos, variables y comentarios en **inglés**. Textos visibles en **español**. |
| Música | **No se incluye en esta versión.** No crear `audio.js` ni botón de silencio. |
| Nombres | Ella: **Valery**. Su hijo: **Kenji** (aparece en las fotos 01 y 10). Él: **Andrés**. Toda frase que mencione a Kenji debe ser coherente con lo que se ve en esa foto. |
| Fotos | Ya optimizadas en `assets/img/` (WebP, 1600 px, sin EXIF). **No tocar la carpeta `Imagenes/`** (originales, ignorada por git). |

---

## 1. Estructura de archivos

```
romantic-presentation/
├── index.html
├── PLAN.md
├── README.md
├── .gitignore
├── css/
│   ├── base.css          # reset, variables, tipografías, utilidades, layout de escenas
│   ├── components.css    # botones, tarjetas, toasts, inputs
│   └── scenes.css        # estilos específicos de cada escena
├── js/
│   ├── main.js           # arranque, router de escenas, persistencia, parámetros de URL
│   ├── content.js        # TODOS los textos (frases, citas, mensajes) — ver sección 5
│   ├── utils.js          # helpers: rand, lerp, clamp, wait, prefersReducedMotion, isMobile, dpr
│   ├── starfield.js      # fondo de estrellas interactivo (siempre visible)
│   ├── scenes/
│   │   ├── intro.js      # tarjeta "Para mi gran amor" + ramo + botones Sí / No
│   │   ├── sad.js        # animación triste del "No"
│   │   ├── loading.js    # carga tipo galaxia + precarga de imágenes
│   │   ├── galaxy.js     # galaxia con frases + corazón de partículas + botón Ingresar
│   │   ├── lock.js       # clave de cumpleaños
│   │   ├── book.js       # libro StPageFlip + efectos de aparición
│   │   ├── puzzle.js     # rompecabezas (se monta dentro de una página del libro)
│   │   ├── volcano.js    # volcán + TE AMO
│   │   └── letter.js     # carta final
│   └── fx/
│       ├── rose.js       # ramo de rosas SVG animado
│       ├── hearts.js     # partículas en forma de corazón (reutilizable: galaxia, volcán, carta)
│       └── reveal.js     # efectos de aparición de las fotos del libro
└── assets/
    └── img/              # photo-XX.webp, photo-XX-tiny.webp, puzzle.webp, og-preview.webp
```

**Rutas siempre relativas** (`assets/img/...`, nunca `/assets/...`): GitHub Pages sirve el sitio bajo
`/romantic-presentation/`, y una barra inicial rompe todo.

---

## 2. Reglas transversales

### 2.1 Diseño
- Paleta (variables CSS en `:root`):
  - Fondos: `--bg-900: #07030f`, `--bg-800: #0e0620`, `--bg-700: #170b33`
  - Morado: `--purple-500: #7c3aed`, `--purple-400: #a855f7`, `--purple-300: #c084fc`
  - Rojo: `--red-500: #e11d48`, `--red-400: #ff2d55`, `--rose: #fb7185`
  - Azul: `--blue-500: #3b82f6`, `--blue-400: #60a5fa`, `--blue-300: #93c5fd`
  - Acento estrellas/oro: `--gold: #fbbf24`
  - Texto: `--text: #f5f0ff`, `--text-muted: #b8a9d9`
- Tipografías (Google Fonts, cargar con `preconnect` + `display=swap`):
  - Títulos románticos: **Great Vibes**
  - Citas y frases: **Cormorant Garamond** (400 y 600 itálica)
  - UI y botones: **Poppins** (400, 600)
- Estética: oscuro, brillos suaves (`box-shadow` con color morado/rojo), degradados radiales,
  vidrio esmerilado (`backdrop-filter: blur`) en tarjetas. Nada plano ni blanco.
- Botón primario: degradado `--purple-500 → --red-500`, borde luminoso, `transform: translateZ` +
  ligera inclinación 3D al pasar el mouse. Área táctil mínima 48x48 px.

### 2.2 Móvil
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Alturas con `100dvh` (fallback `100vh`). `overscroll-behavior: none` en `html, body`.
- `touch-action: manipulation` en botones (evita el zoom por doble toque).
- Todo debe funcionar sin hover: cualquier efecto de hover tiene equivalente al tocar.
- Tamaño mínimo de fuente en cuerpo: 16 px. Los títulos usan `clamp()`.

### 2.3 Rendimiento
- Un solo `requestAnimationFrame` por escena activa; al salir de la escena se cancela.
- Pausar todos los canvas cuando `document.hidden` es `true`.
- Número de partículas proporcional al área de pantalla: `count = base * (w*h) / (390*844)`,
  con tope máximo. `devicePixelRatio` limitado a 2.
- Respetar `prefers-reduced-motion`: reducir partículas a la mitad y acortar duraciones; nunca
  eliminar el contenido.
- Imágenes del libro con `loading="eager"` (ya fueron precargadas en la galaxia) y `decoding="async"`.
- Página completa debe pesar menos de 5 MB y cargar el primer render en menos de 2 s
  en 4G simulado.

### 2.4 Navegación y persistencia
- Las escenas se muestran/ocultan con una clase `.scene.is-active`; cada escena tiene
  `enter()` y `exit()` exportados. `main.js` es el único que cambia de escena
  (`goTo('galaxy')`). Transición entre escenas: fundido de 600 ms.
- Orden del flujo: `intro → (sad ↔ intro) → loading → galaxy → lock → book → volcano → letter`.
- Persistencia en `localStorage` bajo la clave `rp_progress`:
  `{ scene, page, puzzleSolved }`. Al abrir, si hay progreso guardado en `book` o
  posterior, se retoma ahí sin volver a pedir la clave.
- Parámetros de URL (solo para pruebas, no documentar en pantalla):
  - `?scene=intro|sad|loading|galaxy|lock|book|puzzle|volcano|letter` fuerza una escena.
    `puzzle` abre el libro directo en la página del rompecabezas.
  - `?reset=1` borra `localStorage` y arranca desde el inicio.
  - `?fast=1` reduce todas las duraciones largas (carga, erupción) a un 25 % para probar rápido.

### 2.5 Privacidad y SEO
- `<meta name="robots" content="noindex, nofollow">` (que no aparezca en buscadores).
- Etiquetas Open Graph para que al compartir el enlace por WhatsApp se vea bonito:
  título "Para mi gran amor 💜", descripción "Abre esto cuando tengas un momento tranquilo…",
  imagen `assets/img/og-preview.webp` (usar URL absoluta de GitHub Pages en `og:image`).
- La clave es decorativa; no hace falta ofuscarla.

---

## 3. Fondo de estrellas interactivo (`starfield.js`) — siempre activo

Canvas `position: fixed` detrás de todas las escenas.

- 220 estrellas en móvil, 400 en escritorio (escalar por área). Tamaño 0.5 a 2 px, parpadeo
  individual con fase aleatoria (opacidad senoidal, periodo 2 a 6 s).
- 3 capas con velocidades de deriva distintas (paralaje muy sutil, 2 a 6 px por minuto).
- **Interacción obligatoria (requisito 4):**
  - Al mover el mouse: las estrellas a menos de 90 px del puntero aumentan su brillo y tamaño
    (hasta x3) con interpolación suave, y muestran un destello de 4 puntas (dos líneas cruzadas
    con degradado). Al alejarse, vuelven a la normalidad en ~400 ms.
  - Al tocar/hacer clic: además del resaltado, aparecen 6 a 8 estrellitas nuevas que nacen en el
    punto tocado, se expanden 40 a 80 px con una pequeña rotación y se desvanecen en 900 ms.
  - Las estrellas resaltadas toman un tinte aleatorio entre morado, azul claro y dorado.
- Ocasionalmente (cada 6 a 12 s) cruza una estrella fugaz.
- En escritorio, el fondo se desplaza 8 px en dirección contraria al mouse (paralaje).

---

## 4. Fases de desarrollo

Cada fase termina con: (a) la escena se abre con `?scene=...`, (b) se ve bien en 390x844 y en
1366x768, (c) sin errores en consola, (d) commit con mensaje `feat(scene): ...` en inglés.

### Fase 0 — Base del proyecto
1. Crear `index.html` con todas las secciones `<section class="scene" id="scene-xxx">` vacías,
   el canvas del starfield, fuentes, metas de la sección 2.5 y la carga de StPageFlip por CDN:
   `https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js`.
2. `css/base.css` con variables, reset y layout de escenas.
3. `js/utils.js`, `js/content.js` (copiar íntegro el contenido de la sección 5),
   `js/main.js` con router, persistencia y parámetros de URL.
4. `js/starfield.js` completo según la sección 3.

**Aceptación:** se ve el fondo de estrellas interactivo en móvil y escritorio; el router cambia
de escena con `?scene=`; `?reset=1` limpia el progreso.

### Fase 1 — Intro (`intro.js` + `fx/rose.js`)
Tarjeta central de vidrio esmerilado con inclinación 3D siguiendo el mouse (en móvil, una
oscilación lenta automática de ±4°). Contenido de arriba abajo:

1. Título **"Para mi gran amor"** en Great Vibes, `clamp(2.6rem, 10vw, 5rem)`, con degradado
   morado→rosa y brillo suave animado.
2. **Ramo de rosas rojas SVG** (`fx/rose.js`). Debe ser **hermoso**, no un dibujo esquemático.
   Criterios obligatorios:
   - 3 rosas (una central más grande, dos laterales más pequeñas y ligeramente giradas).
   - Cada rosa con mínimo 7 capas de pétalos (paths con curvas Bézier), degradados radiales
     del rojo profundo (`#7f0d1e`) al rojo vivo (`#ff2d55`) con bordes más claros (`#ff6b81`),
     y una sombra interior para dar volumen. Nada de círculos simples.
   - Tallos verdes con degradado, 4 a 6 hojas con nervadura y brillo, un lazo morado en la base.
   - Animación de entrada: las rosas "florecen" (cada capa de pétalos escala desde 0 con
     `transform-origin` en el centro y un retraso escalonado, 1.6 s en total).
   - Animación permanente: balanceo suave del ramo (±2°, 5 s) y pétalos que se desprenden
     cada 2 a 4 s, caen girando y se desvanecen (máximo 6 pétalos simultáneos).
   - Brillo radial detrás del ramo (rojo/morado muy tenue) que respira.
   - Tamaño: 55 % del ancho de la tarjeta en móvil, máximo 260 px.
3. Pregunta: **"¿Deseas iniciar esta etapa conmigo?"** en Cormorant Garamond itálica.
4. Dos botones: **"Sí 💜"** (primario, grande) y **"No"** (secundario, borde tenue).

Comportamiento del botón **No** (requisito 7 + mejora aceptada):
- Las **dos primeras veces** que el puntero se acerca (hover en escritorio) o que se toca
  (`pointerdown` en móvil), el botón se escapa: salta a una posición aleatoria dentro de la
  tarjeta con `transition: transform 250ms` y muestra un microtexto rotativo:
  "¿Segura? 😏", "Piénsalo mejor…". El botón **Sí** crece un 8 % cada vez.
- La **tercera** vez se deja tocar y va a la escena `sad`.

Botón **Sí**: lanza una explosión de 40 corazones desde el
botón (`fx/hearts.js`) y va a `loading` después de 700 ms.

### Fase 2 — Escena triste (`sad.js`)
- El fondo se tiñe de azul oscuro y las estrellas bajan su brillo al 30 % (exponer un método
  `starfield.setMood('sad' | 'normal')`).
- En el centro: una nube gris dibujada en SVG con gotas de lluvia cayendo (CSS), y debajo un
  corazón morado que se parte en dos mitades (SVG con dos paths que se separan y se inclinan)
  y suelta dos lágrimas.
- Texto: **"Mi corazón se hizo chiquito… 💔"** y debajo, tras 1.5 s:
  **"Pero yo no me rindo tan fácil."**
- Botón: **"Está bien, déjame intentarlo otra vez 💜"** → vuelve a `intro` con el corazón
  reparándose (mitades que se juntan) durante la transición. En la intro, el botón "No"
  reinicia su contador de escapes.

### Fase 3 — Carga tipo galaxia (`loading.js`)
Canvas a pantalla completa.
- Galaxia espiral: 900 partículas en móvil (1500 escritorio) distribuidas en 3 brazos
  logarítmicos con dispersión gaussiana, rotando lentamente alrededor del centro. Colores por
  radio: núcleo dorado/blanco, medio morado, exterior azul, con algunas rojas dispersas.
  Núcleo con brillo radial pulsante. Un `globalCompositeOperation: 'lighter'` para que los
  cruces brillen.
- Durante la carga la galaxia gira y **se contrae** hacia el centro a medida que avanza el
  progreso (radio 100 % → 35 %). Al llegar a 100 %, un destello blanco de 300 ms y transición
  a `galaxy`.
- **La carga es real:** precargar las fotos de `content.pages` y `puzzle.webp`.
  El progreso mostrado es `max(progresoReal, progresoTiempo)` donde `progresoTiempo` avanza
  linealmente hasta 100 % en 4.5 s, para que nunca se sienta ni instantánea ni eterna. Duración
  mínima 4.5 s, máxima 12 s (si las imágenes no terminan, continuar igual).
- Texto inferior en Poppins, rotando cada 1.2 s: "Preparando algo para ti…",
  "Alineando las estrellas…", "Recogiendo recuerdos…", "Casi listo, mi amor…". Porcentaje
  pequeño debajo.

### Fase 4 — Galaxia con frases y corazón (`galaxy.js`)
Misma técnica de canvas que la fase 3, pero la galaxia ahora es amplia, lenta y estable, con
estrellas de fondo más densas.

1. **Frases flotantes** (requisito 8): del arreglo `content.galaxyPhrases`. Aparecen una a
   una cada 1.8 s en posiciones aleatorias (evitando el centro y los bordes), en Cormorant
   Garamond itálica, con fundido de entrada, deriva lenta y desvanecimiento a los 6 s. Máximo 5
   simultáneas. Se dibujan en HTML (no en canvas) para que el texto sea nítido.
2. **Corazón de partículas** en el centro: 600 partículas (móvil) / 1000 (escritorio) que
   nacen dispersas y viajan durante 3 s hacia puntos de la curva paramétrica del corazón
   (`x = 16 sin³t`, `y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t`), rellenando también el
   interior con menor densidad. Una vez formado, el corazón **late** (escala 1.0 → 1.08 con
   ritmo de dos pulsos por segundo y medio) y las partículas orbitan ligeramente su punto
   objetivo. Colores: rojo, rosa y morado, con estela corta.
3. Cuando el corazón termina de formarse (a los 3.5 s) aparece en el centro, encima del
   corazón, el botón **"Ingresar"** con un anillo luminoso girando. Al tocarlo → `lock`.

### Fase 5 — Clave de cumpleaños (`lock.js`)
Tarjeta de vidrio con:
- Título: **"Si tanto me conoces, digita mi fecha de cumpleaños"**.
- Tres cajas: `DD` (2 dígitos), `MM` (2 dígitos), `AAAA` (4 dígitos), cada una
  `<input inputmode="numeric" pattern="[0-9]*">`. Autoavance al completar cada caja y
  retroceso con Backspace en caja vacía. Separadores "/" entre cajas.
- Botón **"Comprobar"** (también se comprueba al completar el año).
- Clave correcta: `05` / `02` / `2002`. Aceptar también `5` y `2` sin cero inicial.
- **Fallo:** la tarjeta tiembla (`shake` 500 ms), las cajas se ponen con borde rojo y se
  muestra un mensaje de `content.lockMessages.wrong` en orden (rotando).
  Al **tercer fallo** se muestra `content.lockMessages.hint` de forma permanente.
- **Acierto:** las cajas brillan en dorado, se dispara una lluvia de corazones desde arriba
  (`fx/hearts.js`) y en 900 ms se va a `book`.

### Fase 6 — Libro (`book.js` + `fx/reveal.js`)
Usar StPageFlip con `new St.PageFlip(container, {...})`:

```js
{
  width: 420, height: 560,        // proporción vertical de página
  size: 'stretch',
  minWidth: 280, maxWidth: 600,
  minHeight: 380, maxHeight: 820,
  showCover: true,
  usePortrait: true,              // una sola página en móvil
  mobileScrollSupport: false,
  flippingTime: 900,
  maxShadowOpacity: 0.6,
  drawShadow: true,
}
```

Reservar espacio para controles: en móvil el libro ocupa como máximo 78 % del alto.

**Páginas, en orden:**
1. **Portada** (`data-density="hard"`): fondo morado oscuro con textura sutil, título
   "Nuestra historia" en Great Vibes, subtítulo "Valery & Andrés", y una línea pequeña
   "Ábreme despacio 💜".
2. **Cuatro páginas de foto** (`content.pages[0..3]`: fotos 01, 03, 04 y 05).
3. **Página del rompecabezas** con la cascada (ver Fase 7). Es la única vez que se ve esa foto.
4. **Cinco páginas de foto** (`content.pages[4..8]`: fotos 06 a 10).
5. **Página final del libro**: texto "Hay algo más que quiero mostrarte…" y botón
   **"Ver el final"** → escena `volcano`.
6. **Contraportada** (`data-density="hard"`): "Continuará…".

**Diseño de una página de foto:** marco tipo **polaroid** (papel claro `#fbf7ff`, sombra
suave, ligera rotación aleatoria de ±1.5°). La foto va completa dentro del marco con
`object-fit: contain` sobre fondo del mismo papel (la foto 10 es vertical; el marco se adapta).
Debajo del marco:
- La fecha pequeña en mayúsculas espaciadas (`page.date`).
- La cita (`page.quote`) en Cormorant Garamond itálica, y el autor (`page.author`) alineado a la
  derecha en tamaño menor.
- Una línea separadora corta con degradado y la frase personal (`page.line`) en Cormorant regular.
- Número de página discreto en la esquina.

Si el texto no cabe en móvil, la página tiene desplazamiento vertical interno **solo en la zona
de texto**, nunca en la foto.

**Efecto de aparición al pasar de página (requisito 13):** escuchar el evento `flip` de
StPageFlip; para la página que queda visible, aplicar un efecto de `fx/reveal.js` rotando en
este orden por índice de página (`index % 3`):
- `mosaic`: la foto se divide en una rejilla 4x3 de fichas (cada ficha es un `div` con la
  misma imagen de fondo y `background-position` correspondiente); las fichas entran desde
  posiciones aleatorias con rotación y se acomodan en 900 ms con retraso escalonado.
- `develop`: la foto aparece como polaroid revelándose: de `filter: blur(18px) sepia(1)
  brightness(0.35)` a nítida en 1.8 s, con un brillo que la recorre en diagonal.
- `stardust`: un canvas pequeño encima de la foto genera 150 partículas doradas que convergen
  al centro mientras la foto se revela con `clip-path: circle(0)` → `circle(120%)` en 1.2 s.
Los textos de la página aparecen 400 ms después de la foto con un fundido ascendente.
La primera página que se ve al entrar al libro también dispara su efecto.

**Controles:** flechas "‹ Anterior" y "Siguiente ›" debajo del libro (además del gesto de
arrastrar y del toque en los bordes que trae StPageFlip). Indicador "3 / 13" (portada, 4 fotos, rompecabezas, 5 fotos, página final, contraportada). Guardar la página
actual en `rp_progress.page` y retomarla al recargar (`pageFlip.turnToPage(n)` tras `init`).

### Fase 7 — Rompecabezas (`puzzle.js`)
Se monta dentro de la página del libro con `id="puzzle-page"`.

- Encabezado: `content.puzzle.title` ("Este recuerdo está en piezas. Ármalo conmigo.").
- Tablero 3x3 con `puzzle.webp` (proporción 4:3): cada ficha es un `div` con
  `background-image` y `background-position` calculados (`(col * 100 / 2)% (row * 100 / 2)%`
  con `background-size: 300% 300%`). Separación de 3 px entre fichas, bordes redondeados,
  borde morado tenue.
- Mezcla inicial: permutación aleatoria garantizando que **ninguna** ficha quede en su sitio y
  que no sea la solución.
- **Mecánica:** tocar una ficha la selecciona (borde dorado brillante + escala 1.05); tocar otra
  las intercambia con una animación de 250 ms (usar `transform` con las posiciones calculadas,
  no reordenar el DOM en mitad de la animación). Tocar la misma la deselecciona. Las fichas que
  quedan en su posición correcta reciben un brillo verde-dorado de 400 ms y ya no se marcan de
  forma permanente (que la retroalimentación sea momentánea, para no hacerlo trivial).
- Arrastrar es **opcional**; si se implementa, debe convivir con la mecánica de toque.
- **Bloqueo del avance:** mientras `!solved`, el elemento de la página hace
  `stopPropagation()` en `pointerdown`, `touchstart` y `mousedown` para que StPageFlip no
  inicie un giro, y los botones "Siguiente ›" y el indicador se sustituyen por el texto
  "Arma el rompecabezas para continuar 💜". "‹ Anterior" sigue habilitado.
- **Rescate:** a los **90 s** sin resolver aparece el botón **"Pídeme ayuda 💜"**. Al tocarlo,
  las fichas vuelan a su lugar correcto una por una (80 ms entre cada una) y se considera
  resuelto.
- **Al resolver:** las separaciones desaparecen (fichas se juntan formando la foto completa),
  destello dorado, 60 corazones desde el tablero y aparece debajo, con el mismo diseño de las
  páginas de foto, la fecha `content.puzzle.date`, la cita `content.puzzle.quote` con su autor y
  la frase `content.puzzle.line`. Se habilita "Siguiente ›". Guardar `puzzleSolved: true`; si ya está
  resuelto al recargar, mostrar la foto completa con sus textos directamente.
- Contador de movimientos discreto (solo informativo).

### Fase 8 — Volcán y TE AMO (`volcano.js` + `fx/hearts.js`)
Escena a pantalla completa en canvas (no dentro del libro). Línea de tiempo (multiplicar por
0.25 con `?fast=1`):

| Tiempo | Qué pasa |
|---|---|
| 0 – 2 s | Cielo nocturno con estrellas; volcán en silueta (dos laderas oscuras con degradado, base ancha, cráter en el tercio superior). Brillo rojizo tenue en el cráter que respira. Humo gris-morado sube en volutas (círculos con `alpha` bajo que crecen y se desvanecen). |
| 2 – 4 s | **Retumbo:** la cámara tiembla (offset aleatorio de ±3 px, creciente), el brillo del cráter se intensifica, salen chispas doradas. Texto pequeño "Algo está por pasar…". |
| 4 – 10 s | **Erupción:** 400 a 700 **corazones de lava** (path del corazón relleno con degradado rojo→naranja→amarillo, tamaño 8 a 28 px, con brillo `shadowBlur`) salen del cráter con velocidad inicial hacia arriba y dispersión angular de ±35°, gravedad, rotación y estela corta. Se emiten en ráfagas (cada 120 ms) para que parezca continuo. Al caer, los que tocan las laderas se apagan lentamente y forman **ríos de lava** (degradado animado que baja por ambas laderas). Columna de luz naranja sobre el cráter. La pantalla entera gana un tinte cálido. |
| 10 – 11 s | La emisión cesa; los últimos corazones caen; el resplandor baja. |
| 11 s | Aparece **"TE AMO"** en Great Vibes, tamaño `clamp(4rem, 22vw, 12rem)`, letra por letra (escala 0 → 1 con rebote y brillo rojo/morado), centrado. Un pulso de luz al completarse. Detrás, el volcán sigue con lava suave y una lluvia lenta de corazones pequeños continúa indefinidamente. |
| 13 s | Debajo del TE AMO aparece el botón **"Una última cosa…"** → escena `letter`. |

El TE AMO debe seguir leyéndose bien en móvil: comprobar que no se corta en 360 px de ancho.

### Fase 9 — Carta final (`letter.js`)
Tarjeta tipo papel antiguo (crema `#f8f1e7`, texto en tinta oscura `#2a1a3a`), centrada, con el
texto de `content.letter` (párrafos con fundido secuencial de 600 ms cada uno, como si se
escribiera). Firma "Andrés" en Great Vibes grande y la fecha `content.letter.date`.
Botón final **"Volver a vivirlo 💜"** → `?reset=1` (borra progreso y vuelve a la intro).
Detrás, lluvia lenta de corazones con `fx/hearts.js`.

### Fase 10 — Pulido, pruebas y despliegue
1. Revisar las tres pantallas: 360x800, 390x844, 1366x768. Sin desplazamiento horizontal en
   ninguna escena.
2. Probar el flujo completo dos veces: una diciendo "No" primero, otra directa. Probar recarga
   a mitad del libro y del rompecabezas.
3. Lighthouse móvil: rendimiento ≥ 80, accesibilidad ≥ 90 (contraste, `aria-label` en botones
   de icono, foco visible, `prefers-reduced-motion`).
4. Actualizar `README.md`: qué es, cómo probar en local (`npx serve .` o Live Server), los
   parámetros de URL de prueba y cómo cambiar los textos en `js/content.js`.
5. **Despliegue:** en GitHub → Settings → Pages → "Deploy from a branch" → rama `main`,
   carpeta `/ (root)`. Verificar en la URL pública desde un celular real.

---

## 5. Contenido (`js/content.js`) — copiar tal cual

```js
export const content = {
  intro: {
    title: 'Para mi gran amor',
    question: '¿Deseas iniciar esta etapa conmigo?',
    yes: 'Sí 💜',
    no: 'No',
    noTeases: ['¿Segura? 😏', 'Piénsalo mejor…'],
  },

  sad: {
    line1: 'Mi corazón se hizo chiquito… 💔',
    line2: 'Pero yo no me rindo tan fácil.',
    back: 'Está bien, déjame intentarlo otra vez 💜',
  },

  loading: {
    messages: [
      'Preparando algo para ti…',
      'Alineando las estrellas…',
      'Recogiendo recuerdos…',
      'Casi listo, mi amor…',
    ],
  },

  galaxyPhrases: [
    'Te amo',
    'Gracias por todo',
    'Me haces muy feliz',
    'Eres mi lugar seguro',
    'Contigo todo es mejor',
    'Mi persona favorita',
    'Gracias por elegirme cada día',
    'Valery 💜',
    'Eres mi hogar',
    'Contigo hasta el infinito',
  ],
  galaxyEnter: 'Ingresar',

  lock: {
    title: 'Si tanto me conoces, digita mi fecha de cumpleaños',
    submit: 'Comprobar',
    answer: { day: 5, month: 2, year: 2002 },
    wrong: [
      'Mmm… ¿segura? 😏',
      'Piénsalo bien, tú me lo celebraste 🎂',
      'Casi, casi… pero no 💜',
      'Una más y te doy una pista…',
    ],
    hint: 'Pista: es en febrero, y nací en el 2002 🎈',
  },

  book: {
    coverTitle: 'Nuestra historia',
    coverSubtitle: 'Valery & Andrés',
    coverHint: 'Ábreme despacio 💜',
    prev: '‹ Anterior',
    next: 'Siguiente ›',
    lockedNext: 'Arma el rompecabezas para continuar 💜',
    lastPageText: 'Hay algo más que quiero mostrarte…',
    lastPageButton: 'Ver el final',
    backCover: 'Continuará…',
  },

  // Orden del libro: 01, 03, 04, 05, [rompecabezas = cascada], 06, 07, 08, 09, 10.
  // La cascada NO va aquí: es la foto del rompecabezas (content.puzzle).
  pages: [
    {
      photo: 'assets/img/photo-01.webp', tiny: 'assets/img/photo-01-tiny.webp',
      date: '13 de junio',
      quote: 'Si te quiero es porque sos mi amor, mi cómplice y todo; y en la calle codo a codo somos mucho más que dos.',
      author: 'Mario Benedetti',
      line: 'Tú, Kenji y yo caminando juntos. Ese día entendí que hogar no es un lugar: es hacia donde vamos los tres.',
    },
    {
      photo: 'assets/img/photo-03.webp', tiny: 'assets/img/photo-03-tiny.webp',
      date: '4 de abril',
      quote: 'Te quiero a las diez de la mañana, y a las once, y a las doce del día.',
      author: 'Jaime Sabines',
      line: 'Un cielo así de azul y tú riéndote: no necesito más pruebas de que el universo está de nuestro lado.',
    },
    {
      photo: 'assets/img/photo-04.webp', tiny: 'assets/img/photo-04-tiny.webp',
      date: '4 de abril',
      quote: 'Amar no es mirarse el uno al otro, es mirar juntos en la misma dirección.',
      author: 'Antoine de Saint-Exupéry',
      line: 'Tú sentada con las montañas detrás, y yo con la cámara. Ese día el paisaje no fue lo más bonito de la foto.',
    },
    {
      photo: 'assets/img/photo-05.webp', tiny: 'assets/img/photo-05-tiny.webp',
      date: '4 de abril',
      quote: 'Pies, ¿para qué los quiero, si tengo alas para volar?',
      author: 'Frida Kahlo',
      line: 'Esas alas ya eran tuyas antes de la foto. Gracias por enseñarme a volar contigo.',
    },
    {
      photo: 'assets/img/photo-06.webp', tiny: 'assets/img/photo-06-tiny.webp',
      date: '3 de abril',
      quote: 'Duda que las estrellas sean fuego, duda que el sol se mueva, duda que la verdad sea mentira; pero nunca dudes de mi amor.',
      author: 'William Shakespeare',
      line: 'Hasta la luna salió a vernos esa noche. Y yo, con tanta luz, solo te veía a ti.',
    },
    {
      photo: 'assets/img/photo-07.webp', tiny: 'assets/img/photo-07-tiny.webp',
      date: '3 de abril',
      quote: 'Andábamos sin buscarnos, pero sabiendo que andábamos para encontrarnos.',
      author: 'Julio Cortázar',
      line: 'Una tarde cualquiera bajo un techo cualquiera, y aun así todo me parecía extraordinario porque estabas.',
    },
    {
      photo: 'assets/img/photo-08.webp', tiny: 'assets/img/photo-08-tiny.webp',
      date: '3 de abril',
      quote: '¿Qué es poesía?, dices mientras clavas en mi pupila tu pupila. ¿Qué es poesía? ¿Y tú me lo preguntas? Poesía… eres tú.',
      author: 'Gustavo Adolfo Bécquer',
      line: 'Calles blancas, cielo gris, y tu sonrisa poniéndole color a todo.',
    },
    {
      photo: 'assets/img/photo-09.webp', tiny: 'assets/img/photo-09-tiny.webp',
      date: '7 de marzo',
      quote: 'Los amantes no se encuentran en algún lugar. Están el uno en el otro desde siempre.',
      author: 'Rumi',
      line: 'De nuestras primeras fotos juntos. Aquí ya lo sabía, aunque todavía no me atrevía a decirlo.',
    },
    {
      photo: 'assets/img/photo-10.webp', tiny: 'assets/img/photo-10-tiny.webp',
      date: '13 de junio',
      quote: 'Solo se ve bien con el corazón; lo esencial es invisible a los ojos.',
      author: 'Antoine de Saint-Exupéry',
      line: 'Tú y Kenji mirando hacia arriba, y yo detrás de la cámara, seguro de una cosa: quiero cuidarlos a los dos toda la vida.',
    },
  ],

  puzzle: {
    image: 'assets/img/puzzle.webp',
    title: 'Este recuerdo está en piezas. Ármalo conmigo.',
    help: 'Pídeme ayuda 💜',
    helpAfterMs: 90000,
    moves: 'Movimientos',
    date: '17 de mayo',
    quote: 'Te amo sin saber cómo, ni cuándo, ni de dónde; te amo directamente, sin problemas ni orgullo.',
    author: 'Pablo Neruda',
    line: 'Frente a toda esa agua cayendo, lo único que yo miraba eras tú. Así se arma un amor: pieza por pieza, con paciencia, hasta que todo encaja.',
  },

  volcano: {
    warning: 'Algo está por pasar…',
    finalText: 'TE AMO',
    next: 'Una última cosa…',
  },

  letter: {
    greeting: 'Valery,',
    paragraphs: [
      'Gracias por cada foto de este libro y por todas las que todavía no hemos tomado.',
      'Quiero despertar contigo, pelear por la cobija, aprender tus manías y que tú aprendas las mías. Quiero que "mi casa" pase a ser "nuestra casa", y que Kenji crezca sabiendo que en ella tiene a alguien más que lo quiere y lo cuida.',
      'No te prometo que todo será perfecto. Te prometo que en cada día imperfecto vas a tenerme a tu lado, eligiéndote otra vez.',
      'Empecemos esta etapa juntos.',
    ],
    signature: 'Andrés',
    date: '27 de septiembre de 2026',
    restart: 'Volver a vivirlo 💜',
  },
};
```

---

## 6. Pendientes de Andrés (no bloquean el inicio)
- [ ] Revisar y ajustar los textos de la sección 5 (especialmente la carta final y las frases
      donde aparece Kenji).
- [ ] Confirmar la fecha que firma la carta.
