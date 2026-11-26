# Diseño: editor del banco de preguntas y personalización de la pantalla del público

Fecha: 2026-11-25

## Intención

El juego es la actividad del Congreso PROXY, pero se va a reutilizar en **otros eventos de la misma
escuela**. La marca PROXY se queda (título del juego y logo), pero de un evento a otro cambian
detalles: el año, la edición, el lema, los créditos, si salen patrocinadores, y sobre todo **qué
preguntas** se juegan. Hoy nada de eso se puede cambiar sin editar el código: las 27 preguntas base
de `js/preguntas.js` no se pueden editar, las personalizadas solo se pueden borrar, y la portada del
proyector tiene todos sus textos fijos en `proyector.html`.

El moderador debe poder preparar un evento completo desde el panel (`index.html`), guardarlo en un
archivo y abrirlo en la computadora del auditorio.

## Metas

1. **Banco de preguntas editable**: ver todas las preguntas (base + personalizadas), editar texto,
   categoría, dificultad, respuestas, puntos y sinónimos; agregar, duplicar, desactivar, borrar y
   restaurar la versión original de una pregunta base.
2. **Elegir qué preguntas salen**: dos modos por partida: **al azar** (como hoy, por categoría y
   dificultad) o **lista fija** (el moderador elige las preguntas exactas y su orden).
3. **Pantalla del público configurable**: mostrar/ocultar elementos de la portada y del resto de
   pantallas del proyector, y editar sus textos.
4. **Exportar/importar toda la preparación** (preguntas + configuración + pantalla) en un archivo.

## No metas

- Cambiar el título del juego ("100 Programadores Dijeron") o el logo de PROXY.
- Subir logos de patrocinadores o elegirlos uno por uno: los patrocinadores siguen siendo **todos o
  ninguno** (decisión del usuario).
- Escribir cambios en `js/preguntas.js` en disco.
- Sincronizar automáticamente entre computadoras (para eso está exportar/importar).

## Anti-metas (sería un fracaso aunque funcione)

- Que editar una pregunta base haga que se pierdan las preguntas nuevas que se agreguen después a
  `js/preguntas.js`.
- Que el juego deje de funcionar al abrir `index.html` con doble clic (sin servidor) o en GitHub Pages.
- Que una configuración guardada vieja (localStorage de versiones anteriores) rompa el juego.
- Que el proyector muestre respuestas ocultas o cualquier dato del banco que no se esté jugando.

## Restricciones

- HTML/CSS/JS vanilla, sin build ni dependencias. Scripts clásicos (no módulos), cargados en orden
  desde `index.html` y `proyector.html`.
- Todo se guarda en `localStorage` mediante `Guardado` (`js/almacen.js`), que ya tolera navegadores
  que bloquean el almacenamiento.
- El proyector no lee `localStorage`: todo lo recibe del panel en el estado que publica
  `UI.publicar()` (`js/admin.js`) por `CanalPanel` (`js/canal.js`). Funciona por `postMessage`,
  `BroadcastChannel` y el servidor de OBS; lo nuevo debe viajar por el mismo estado.
- Una pregunta válida sigue las reglas de `Pregunta.validarDatos` (`js/modelos.js`): 5 a 8 respuestas,
  puntos enteros > 0, suma ≤ 100, sin respuestas repetidas.
- Textos nuevos se insertan con `textContent` (nunca `innerHTML`) en el proyector.
- Interfaz en español, mismo estilo visual (pixel art PROXY, componentes `.btn`, `.tarjeta`, `Modal`).

## Enfoques considerados (para guardar los cambios del banco)

| Enfoque | Qué es | Ventaja | Desventaja |
|---|---|---|---|
| **A. Guardar solo los cambios** ✅ elegido | `preguntas.js` sigue siendo la base; el navegador guarda solo ediciones, desactivaciones y borrados, por id | Las preguntas nuevas del archivo aparecen solas; siempre se puede restaurar el original | Necesita ids estables en las preguntas base |
| B. Copiar el banco al navegador | Al primer cambio se copia todo; desde ahí la copia es el banco | Más simple | Preguntas nuevas del archivo ya no aparecen sin "restablecer todo" |
| C. Escribir `preguntas.js` | Guardar en disco vía el servidor local | Un solo lugar | Solo funciona con el servidor encendido; no con doble clic ni GitHub Pages |

El usuario eligió **A**.

## Diseño

### 1. Modelo de datos del banco

- Cada pregunta base de `js/preguntas.js` recibe un campo **`id`** fijo (p. ej. `"b01"` … `"b27"`).
  Las preguntas nuevas que se agreguen al archivo deben traer su id (documentarlo en el comentario
  del archivo). Ids únicos; `validarDatos` no necesita exigirlo, pero el almacén sí debe ignorar
  duplicados con aviso en consola.
- Las preguntas personalizadas (clave existente `cpd_preguntas_personalizadas`) reciben un id
  `"p-<aleatorio>"` al crearse. **Migración**: al cargar, las que no tengan id reciben uno y se guardan.
- Nueva clave `cpd_banco_cambios` con la forma:
  ```js
  { version: 1,
    editadas: { "<idBase>": { categoria, dificultad, pregunta, respuestas } },
    desactivadas: ["<id>", ...],   // base o personalizadas
    borradas: ["<idBase>", ...] }  // solo base; las personalizadas se borran de verdad
  ```
- `AlmacenPreguntas.todas()` devuelve la **vista efectiva activa**: base (con su edición aplicada si
  existe, sin borradas) + personalizadas, quitando desactivadas, y filtrando inválidas como hoy.
  Cada elemento lleva su `id`. Hace falta además una función que devuelva **todas incluyendo
  desactivadas y borradas**, con su estado (`activa` / `desactivada` / `borrada`, y si es `base`,
  `editada` o `personalizada`), para la pantalla del banco.
- Unicidad: no puede haber dos preguntas activas o desactivadas con el mismo texto (comparando con
  `Validador.compactar`), excluyendo la propia al editar. Aplica igual al editar una base (no puede
  quedar con el texto de otra). Las borradas no cuentan; si al **restaurar** una base su texto ya lo
  usa otra pregunta, la restauración se bloquea con un aviso que dice cuál.
- Orden de respuestas: no hace falta ordenarlas al guardar; `Pregunta` ya las ordena por puntos al
  construirse, así que el tablero siempre muestra las N con más puntos.
- Como los ids se escriben dentro de cada pregunta en `preguntas.js`, viajan con ella: reordenar o
  borrar preguntas del archivo no cambia los ids de las demás. Un id de `cambios` que ya no existe en
  el archivo se ignora (y se limpia al guardar).
- Las partidas guardadas (`cpd_partida`) ya llevan su propia copia de las preguntas
  (`Juego.exportar`), así que editar el banco no afecta "Continuar partida".

### 2. Pantalla "Banco de preguntas" (panel)

Reemplaza a la pantalla "Agregar pregunta" (`#pantalla-agregar`); el botón del menú pasa a decir
**"Banco de preguntas"**.

- **Lista** de todas las preguntas con: texto, categoría, dificultad, número de respuestas y una
  etiqueta de estado (Original / Editada / Tuya / Desactivada / Borrada). Conteo arriba.
- **Buscar** por texto (pregunta o respuestas) y **filtrar** por categoría, dificultad y estado.
  Las borradas solo se ven con el filtro de estado "Borradas".
- **Acciones por pregunta**: Editar · Duplicar · Desactivar/Activar · Borrar ·
  Restaurar original (solo base editada o borrada). Borrar pide confirmación con `Modal`; borrar una
  personalizada es definitivo, borrar una base es reversible con "Restaurar original".
- **Formulario** (para agregar, editar y duplicar): pregunta, categoría (con datalist), dificultad y
  **de 5 a 8 filas** de respuesta (texto, puntos, sinónimos separados por comas), con botones para
  agregar/quitar fila. Muestra la suma en vivo (ya existe `actualizarSuma`) y los errores de
  `validarDatos`. Nota visible: "En el tablero salen las N con más puntos" (N según la configuración).
- Duplicar abre el formulario lleno con el texto "(copia)" y guarda como personalizada nueva.
- Editar una base guarda en `editadas`; editar una personalizada la reemplaza en su lista.
- Al guardar o cambiar algo, se actualiza el conteo del menú (`actualizarConteo`).

### 3. Modo de preguntas de la partida (pantalla de configuración)

- Nuevo control en `#pantalla-config`: **Preguntas: ( ) Al azar ( ) Lista fija**. Se guarda en
  `cpd_config` como `modoPreguntas: "azar" | "lista"` y `listaFija: ["<id>", ...]`.
  Por defecto `"azar"` (configuraciones viejas siguen igual).
- **Al azar**: como hoy (categorías + dificultad).
- **Lista fija**: se ocultan los filtros de categoría/dificultad y aparece una lista ordenada con
  tantas casillas como `preguntasNecesarias(opciones)` (rondas normales + final). Cada casilla dice
  "Ronda 1", "Ronda 2", … "Ronda final" y permite elegir una pregunta del banco activo (selector con
  búsqueda), subirla/bajarla y quitarla. Si cambian las rondas, la lista se recorta o deja casillas
  vacías.
- No se puede iniciar si hay casillas vacías, preguntas repetidas o ids que ya no están activos
  (desactivados, borrados o inexistentes): se muestra el error en `#error-config` diciendo cuál.
- `Juego` necesita poder recibir las preguntas **sin barajar** (p. ej. una opción o un parámetro
  nuevo); el resto del flujo (recortar respuestas a `opciones.respuestas`) no cambia.

### 4. Pantalla del público (panel → proyector)

Nueva pantalla del panel **"Pantalla del público"**, con botón en el menú. Guarda en una clave nueva
`cpd_pantalla` (mezclada con valores por defecto, como `AlmacenConfig.cargar`). Botón
**"Restablecer valores originales"**.

| Elemento (proyector) | Dónde está hoy | Mostrar/ocultar | Texto editable (por defecto) |
|---|---|---|---|
| Banner de marca | `.marca` | ✓ | "CONGRESO", "PROXY 2026", "EDICIÓN XV" (3 campos) |
| Texto de arranque tipo BIOS | `pre.boot` | ✓ | — |
| Robot con letrero del título | `.letrero-portada` (el título sigue visible aunque se oculte el robot) | ✓ | — |
| Globo del robot | `#globo-robot`, frases en `js/proyector.js:10-22` | ✓ | lista de frases, una por línea |
| Lema | `.lema-proxy` | ✓ | "Crea, conecta y conquista." |
| Cuenta regresiva | `#cuenta-inicio` | ✓ | — |
| Prompt de espera | `.prompt` | ✓ | "esperando al moderador" |
| Marca en el marcador del juego | `.marcador-marca` | ✓ | "PROXY 2026" |
| Logo PROXY en la laptop (transición) | `.laptop img` | ✓ | — |
| Créditos de la pantalla final | `.creditos p` | ✓ | el texto actual, como texto plano |
| **Patrocinadores** (portada, entre rondas y créditos) | clase `sin-patrocinadores` | ✓ | — |

- El checkbox de patrocinadores se **mueve** de la configuración de partida a esta pantalla; el valor
  sigue en `cpd_config.patrocinadores` para no romper configuraciones guardadas (decisión del builder
  si conviene migrarlo a `cpd_pantalla`, siempre que lo viejo se respete).
- `UI.publicar()` agrega un objeto `pantalla` al estado en **todas** las pantallas (incluida
  `"espera"`). `Proyector.recibir()` lo aplica: oculta con `hidden`/clase y escribe textos con
  `textContent`. Frases vacías ⇒ el globo se oculta. Valores ausentes ⇒ defaults (proyector viejo o
  estado viejo no se rompen).
- Límites de longitud (`maxlength` en el formulario y recorte al aplicar en el proyector):
  textos del banner 20 caracteres, lema y prompt 60, cada frase del globo 80 (máximo 20 frases),
  marca del marcador 20, créditos 200. El CSS debe permitir que lema, globo y créditos se acomoden en
  dos líneas sin desbordar.
- Los cambios se publican **al momento** (al editar cualquier campo), para que el moderador los vea
  en el proyector mientras prepara.
- El `<title>` del proyector y el panel del moderador no cambian (el panel es solo para el moderador).

### 5. Exportar / importar todo

- En el menú (o en la pantalla del banco): **Exportar preparación** descarga
  `preparacion-100pd.json`:
  ```js
  { tipo: "100pd-preparacion", version: 1, exportadoEn: "<ISO>",
    personalizadas: [...], cambios: {...cpd_banco_cambios},
    config: {...cpd_config sin nombres de equipo}, pantalla: {...cpd_pantalla} }
  ```
- **Importar preparación** pide confirmación ("reemplaza tus preguntas, configuración y pantalla
  actuales") y valida la estructura; preguntas inválidas se ignoran contando cuántas. **Reemplaza**:
  borra antes las personalizadas, los cambios, la configuración (menos los nombres de equipo) y la
  pantalla de esta computadora. Ids de `cambios` que no existan en el `preguntas.js` local se ignoran;
  categorías de `config` que no existan aquí se descartan (si no queda ninguna, `categorias: null`);
  una `listaFija` con ids inexistentes se importa tal cual y la pantalla de configuración la marca
  como inválida al intentar iniciar (regla de la sección 3).
- Se sigue aceptando el formato viejo (un arreglo `[...]` de preguntas): se importan como
  personalizadas, como hoy.

## Lo que decidió el usuario

- Usar el juego en otros eventos de la misma escuela; la marca PROXY se queda.
- Guardar solo los cambios del banco (enfoque A).
- Ambos modos de preguntas: al azar y lista fija.
- Patrocinadores: solo mostrar u ocultar todos.

## Decisiones mías (revisables)

- Ids `b01…b27` en `preguntas.js`; `p-<aleatorio>` para personalizadas.
- La pantalla del banco reemplaza a "Agregar pregunta".
- Borrar una pregunta base es reversible; borrar una personalizada es definitivo.
- El título del juego queda visible aunque se oculte el robot del letrero.
- Exportar no incluye los nombres de los equipos (cambian cada partida).
- Importar una preparación nueva reemplaza todo; el formato viejo (arreglo) suma preguntas.
- Restaurar una base se bloquea si su texto choca con otra pregunta.
- Límites de longitud de los textos de la pantalla del público (sección 4).

## Lo que queda al builder

- Maquetación exacta de las pantallas nuevas y si el formulario del banco es modal o panel lateral.
- Cómo se implementa el "sin barajar" en `Juego`.
- Pruebas: no hay suite; se recomienda un script de Node (como el que ya se usó para validar el banco)
  que pruebe la lógica de `AlmacenPreguntas` (vista efectiva, migración de ids, restaurar) y la lista
  fija, más una revisión manual en navegador del panel y del proyector.
- Actualizar `README.md` (sección "Cómo agregar preguntas" y opciones de la pantalla del público).
