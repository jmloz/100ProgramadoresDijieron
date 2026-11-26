# Banco de preguntas editable y pantalla del público configurable — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el moderador pueda editar todo el banco de preguntas, elegir al azar o en lista fija qué preguntas salen, configurar qué se muestra y qué dice la pantalla del público, y llevarse toda la preparación en un archivo.

**Architecture:** Las preguntas base de `js/preguntas.js` reciben ids fijos y el navegador guarda solo los cambios sobre ellas (`cpd_banco_cambios`); `AlmacenPreguntas` calcula la vista efectiva. La configuración de la pantalla del público vive en un archivo nuevo `js/pantalla.js` (defaults + normalización) que cargan el panel y el proyector; el panel la guarda en `cpd_pantalla` y la manda en cada estado publicado. La lógica pura se prueba con `node --test` cargando los scripts clásicos en un contexto `vm`.

**Tech Stack:** HTML/CSS/JS vanilla (scripts clásicos, sin build), localStorage, Node ≥ 20 solo para pruebas (`node:test`, `node:assert`, `node:vm`).

**Spec:** `docs/superpowers/specs/2026-11-25-banco-y-pantalla-design.md`

## Global Constraints

- Sin dependencias, sin build, sin módulos ES: el juego debe seguir abriendo con doble clic en `index.html`, en GitHub Pages y con `servidor-obs.ps1`.
- Todo acceso a localStorage pasa por `Guardado` (`js/almacen.js`).
- El proyector no lee localStorage; todo le llega en el estado de `UI.publicar()`.
- Textos del usuario en el DOM siempre con `textContent` (o `el(..., {texto})`), nunca `innerHTML`.
- Pregunta válida = `Pregunta.validarDatos` (5–8 respuestas, puntos enteros > 0, suma ≤ 100, sin repetidas).
- Claves nuevas: `cpd_banco_cambios`, `cpd_pantalla`. Claves existentes que no cambian de forma: `cpd_preguntas_personalizadas` (solo se le agrega `id` a cada pregunta), `cpd_config` (se le agregan `modoPreguntas` y `listaFija`), `cpd_partida`, `pd-presentacion`.
- Límites de texto de la pantalla del público: banner (cada uno de los 3 textos) 20, lema 60, prompt 60, cada frase del globo 80 (máx. 20 frases), marca del marcador 20, créditos 200.
- Interfaz y mensajes en español; commits en español, **sin** líneas `Co-Authored-By` ni atribución a Claude.
- Pruebas: `node --test tests/` desde la raíz del repo.

## Review Focus

1. **Configuración vieja en localStorage** (preguntas personalizadas sin `id`, `cpd_config` sin `modoPreguntas`, sin `cpd_pantalla`): el juego abre, migra ids una sola vez y se comporta como antes. → prueba en Task 2 y Task 5.
2. **Lista fija que apunta a una pregunta que luego se desactiva o borra**: no se puede iniciar y el error dice qué ronda. → prueba en Task 3.
3. **Restaurar una base cuyo texto ya usa otra pregunta**: se bloquea con aviso, no crea duplicado. → prueba en Task 2.
4. **Estado viejo o incompleto en el proyector** (sin `pantalla`, campos faltantes, textos larguísimos, tipos raros): usa defaults y recorta. → prueba de `normalizarPantalla` en Task 5.
5. **Importar un archivo ajeno o dañado** (JSON que no es preparación, preguntas inválidas, ids inexistentes, categorías desconocidas): no rompe nada, informa cuántas se ignoraron. → prueba en Task 7.

---

### Task 1: Arnés de pruebas e ids en las preguntas base

**Files:**
- Create: `tests/cargar.js`, `tests/preguntas.test.js`
- Modify: `js/preguntas.js` (comentario de cabecera + campo `id` en cada pregunta)

**Interfaces:**
- Produces: `cargar(archivos: string[], nombres: string[], opciones?: { almacen?: object }) → object` en `tests/cargar.js`. Crea un contexto `vm` con un `localStorage` falso en memoria (`getItem/setItem/removeItem/clear`, respaldado por `opciones.almacen` si se pasa, para poder inspeccionarlo), `console`, `crypto` y `Math`; ejecuta cada archivo (ruta relativa a la raíz) con `vm.runInContext` y devuelve `vm.runInContext("({" + nombres.join(",") + "})", ctx)`. Así se obtienen los `const`/`class` de nivel superior sin tocar el código.
- Produces: cada pregunta base con `id: "b01"` … `"b27"` en el orden actual del archivo.

- [ ] **Step 1: Escribir la prueba que falla** — `tests/preguntas.test.js`:
  - `test("cada pregunta base tiene un id único bNN")`: carga `js/preguntas.js` con nombres `["PREGUNTAS_BASE"]`; afirma que todo `id` cumple `/^b\d{2}$/` y que `new Set(ids).size === PREGUNTAS_BASE.length`.
  - `test("todas las preguntas base son válidas y suman 100")`: carga `js/validador.js, js/modelos.js, js/preguntas.js`; para cada una `Pregunta.validarDatos(p)` es `[]` y la suma de puntos es 100.
- [ ] **Step 2:** `node --test tests/` → FAIL en la prueba de ids.
- [ ] **Step 3:** Agregar `id` como primer campo de cada objeto de `PREGUNTAS_BASE` (b01…b27). En el comentario de reglas del archivo, añadir: `"id": identificador único y fijo (b28, b29…). No lo cambies ni lo reuses: el juego guarda las ediciones por id.`
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `Agregar ids a las preguntas base y pruebas con node --test`.

---

### Task 2: Almacén del banco con cambios por id

**Files:**
- Modify: `js/almacen.js` (objeto `AlmacenPreguntas`)
- Test: `tests/almacen.test.js`

**Interfaces:**
- Consumes: `Pregunta.validarDatos`, `Validador.compactar`, `PREGUNTAS_BASE` con ids (Task 1), `cargar` (Task 1).
- Produces (en `AlmacenPreguntas`):
  - `CLAVE_CAMBIOS = "cpd_banco_cambios"`; forma guardada `{ version: 1, editadas: {[id]: datos}, desactivadas: string[], borradas: string[] }`.
  - `personalizadas() → datos[]` — ahora asigna `id: "p-" + aleatorio` a las que no lo tienen y guarda la lista migrada (una sola vez).
  - `catalogo() → Array<{ id, datos, origen: "base"|"personalizada", estado: "activa"|"desactivada"|"borrada", editada: boolean }>` — todas, base primero en orden de archivo y luego personalizadas. `datos` ya trae la edición aplicada y su `id`.
  - `todas() → datos[]` — solo `estado === "activa"` y válidas (como hoy, con `console.warn` para inválidas). Cada `datos` lleva `id`.
  - `porId(id) → datos | null` — entre las activas.
  - `agregar(datos) → string[]` (errores; asigna id nuevo).
  - `editar(id, datos) → string[]` — base: guarda en `editadas[id]`; personalizada: reemplaza conservando el id.
  - `desactivar(id)`, `activar(id)` → `void`.
  - `borrar(id)` → `void` — base: va a `borradas` (y sale de `desactivadas`); personalizada: se elimina de la lista y de `desactivadas`.
  - `restaurar(id) → string[]` — solo base: quita `editadas[id]` y `borradas`; si el texto original choca con otra pregunta no borrada, no cambia nada y devuelve `["No se puede restaurar: «<texto>» ya existe."]`.
  - `importar(arreglo)` se conserva (formato viejo: suma). Se **elimina** `eliminar(indice)`.
  - `categorias()`, `filtrar()` sin cambios de firma (usan `todas()`).
- Regla de unicidad (helper privado `_textoOcupado(texto, excluirId) → boolean`): compara con `Validador.compactar` contra activas y desactivadas, sin contar borradas ni `excluirId`. Mensaje: `"Ya existe una pregunta con ese texto."`.
- Al guardar `cambios`, se descartan ids que no estén en `PREGUNTAS_BASE` ni en personalizadas.

- [ ] **Step 1: Escribir las pruebas que fallan** — `tests/almacen.test.js`, cada una con un almacén nuevo (`cargar(["js/validador.js","js/modelos.js","js/preguntas.js","js/almacen.js"], ["AlmacenPreguntas","PREGUNTAS_BASE"], { almacen })`):
  - `migra ids de personalizadas viejas`: con `almacen["cpd_preguntas_personalizadas"]` = un arreglo de 1 pregunta válida sin id → `personalizadas()[0].id` empieza con `"p-"` y el JSON guardado ya lo contiene; dos llamadas devuelven el mismo id.
  - `todas() incluye las 27 base con id`: `todas().length === 27` y `todas()[0].id === "b01"`.
  - `editar una base cambia la vista y restaurar la devuelve`: `editar("b01", {...b01, pregunta: "Otra cosa"})` → `[]`; `porId("b01").pregunta === "Otra cosa"`; `catalogo()` marca `editada: true`; `restaurar("b01")` → `[]` y vuelve el texto original.
  - `desactivar saca de todas() pero sigue en catalogo()`: `desactivar("b02")` → `todas().length === 26`, `catalogo().find(x => x.id === "b02").estado === "desactivada"`; `activar("b02")` → 27.
  - `borrar base es reversible, borrar personalizada no`: `borrar("b03")` → estado `"borrada"`; `restaurar("b03")` → activa. Agregar personalizada, `borrar(id)` → ya no aparece en `catalogo()`.
  - `no permite texto repetido`: `agregar({...b01 sin id})` → `["Ya existe una pregunta con ese texto."]`; `editar("b02", {...b02, pregunta: b01.pregunta})` → mismo error.
  - `restaurar se bloquea si el texto choca`: `borrar("b04")`; `agregar({...b04 sin id})` → `[]`; `restaurar("b04")` → arreglo con un mensaje que contiene `"No se puede restaurar"`; `b04` sigue `"borrada"`.
  - `ids desconocidos en cambios se ignoran`: con `almacen["cpd_banco_cambios"]` = `{version:1, editadas:{zz1:{}}, desactivadas:["zz2"], borradas:[]}` → `todas().length === 27` sin lanzar.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar la API de arriba en `js/almacen.js`. Id aleatorio: `"p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `Banco de preguntas: guardar ediciones, desactivadas y borradas por id`.

---

### Task 3: Partida con lista fija (lógica)

**Files:**
- Modify: `js/juego.js` (`constructor`, `_elegirPreguntas`), `js/almacen.js` (`AlmacenConfig.POR_DEFECTO`, nueva función en `AlmacenPreguntas`)
- Test: `tests/juego.test.js`, `tests/almacen.test.js`

**Interfaces:**
- Consumes: `AlmacenPreguntas.porId`, `todas` (Task 2).
- Produces:
  - `Juego` acepta `opciones.ordenFijo: boolean` (default `false`). Con `true`, `_elegirPreguntas` toma las primeras `cantidad` del banco **en el orden recibido**, sin barajar. `normalizarOpciones` no lo pierde (o el constructor lo lee de `opciones` antes de normalizar).
  - `AlmacenConfig.POR_DEFECTO` agrega `modoPreguntas: "azar"` y `listaFija: []`.
  - `AlmacenPreguntas.resolverLista(ids: string[], necesarias: number) → { preguntas: datos[], errores: string[] }`. Errores, uno por problema, con estos textos exactos:
    - longitud distinta: `"La lista debe tener ${necesarias} preguntas (tiene ${n})."`
    - casilla vacía (`""`/`null`): `"Falta elegir la pregunta de la ${etiqueta}."`
    - id no activo: `"La pregunta de la ${etiqueta} ya no está disponible (desactivada o borrada)."`
    - repetida: `"La pregunta de la ${etiqueta} está repetida."`
    - `etiqueta` = `"ronda N"` (1-based) y, para la última posición cuando hay ronda final, `"ronda final"`; recibe `rondaFinal: boolean` como tercer parámetro: firma final `resolverLista(ids, necesarias, rondaFinal)`.

- [ ] **Step 1: Pruebas que fallan**
  - `tests/juego.test.js` → `ordenFijo respeta el orden`: banco de 4 preguntas válidas en orden conocido, `new Juego("A","B",banco,{rondas:3, rondaFinal:true, ordenFijo:true}, () => 0)`; `juego.preguntas.map(p => p.texto)` igual a los 4 textos en orden. Y `sin ordenFijo baraja`: con `aleatorio = () => 0` el orden difiere del original.
  - `tests/almacen.test.js` → `resolverLista`: con `["b01","b02","b03","b04"]`, 4, true → `errores: []`, `preguntas.map(p=>p.id)` igual. Con `["b01","","b01","b05"]` tras `desactivar("b05")` → errores contienen `"Falta elegir la pregunta de la ronda 2."`, `"La pregunta de la ronda 3 está repetida."`, `"La pregunta de la ronda final ya no está disponible (desactivada o borrada)."`. Con 3 ids y 4 necesarias → `"La lista debe tener 4 preguntas (tiene 3)."`.
  - `AlmacenConfig.cargar()` sin nada guardado → `modoPreguntas === "azar"` y `listaFija` es `[]`.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `Partida con lista fija de preguntas (lógica)`.

---

### Task 4: Pantalla "Banco de preguntas" en el panel

**Files:**
- Modify: `index.html` (`#pantalla-agregar` → `#pantalla-banco`; botón del menú), `js/editor.js` (reescribir como objeto `Banco`), `js/admin.js` (navegación `data-ir`, `actualizarConteo`), `css/estilos.css` (estilos de lista y estado)

**Interfaces:**
- Consumes: API de `AlmacenPreguntas` (Task 2), `Modal`, `el`, `$`, `irA`, `mostrarPantalla`, `actualizarConteo`, `UI.config.respuestas`.
- Produces: `Banco.iniciar()`, `Banco.abrir()` (sustituyen a `Editor.iniciar/abrir`); botón del menú `data-ir="banco"` con texto `"☰ Banco de preguntas"`; en `admin.js` el listener de `[data-ir]` llama `Banco.abrir()` cuando `destino === "banco"`.

Comportamiento (de la spec, sección 2):
- Encabezado con conteo `"${activas} activas de ${total}"`, caja de búsqueda (texto de pregunta o de cualquier respuesta, con `Validador.normalizar`), filtros de categoría, dificultad y estado (`Todas`, `Originales`, `Editadas`, `Tuyas`, `Desactivadas`, `Borradas`; las borradas solo salen con su filtro).
- Cada fila: texto, categoría · dificultad · N respuestas, etiqueta de estado y botones `Editar`, `Duplicar`, `Desactivar`/`Activar`, `Borrar` (o `Restaurar original` si está borrada), y `Restaurar original` también si es base editada. Borrar confirma con `Modal` (texto distinto para base: "Podrás restaurarla después" y personalizada: "No se puede deshacer"). Errores de `restaurar` se muestran en `Modal`.
- Botón `＋ Nueva pregunta`. Formulario (puede ser la misma tarjeta, encima de la lista) con pregunta (`maxlength 140`), categoría (datalist), dificultad y filas de respuesta: empieza con 5, botones `＋ Respuesta` (hasta 8) y `✕` por fila (mínimo 5). Suma en vivo `"Suma: X / 100"` y nota `"En el tablero salen las ${UI.config.respuestas} con más puntos."`. Guardar llama `agregar` o `editar` según el modo; muestra errores en `#error-banco`. Duplicar abre el formulario lleno, con `" (copia)"` al final del texto, en modo agregar.
- Se quitan los botones viejos "Exportar JSON / Importar JSON" de esta pantalla (los reemplaza Task 7).

- [ ] **Step 1:** Implementar HTML, `Banco` y estilos.
- [ ] **Step 2:** `node --test tests/` → PASS (sin regresiones).
- [ ] **Step 3: Verificación manual** (abrir `index.html` con doble clic): editar "Una IA que un programador usa" agregando una 8.ª respuesta → aparece "Editada"; recargar la página → el cambio sigue; `Restaurar original` → vuelve a 7 respuestas; desactivar una → el conteo del menú baja en 1; filtro "Borradas" muestra solo las borradas; consola sin errores.
- [ ] **Step 4:** Commit `Pantalla Banco de preguntas: editar, duplicar, desactivar, borrar y restaurar`.

---

### Task 5: Configuración de la pantalla del público (lógica compartida)

**Files:**
- Create: `js/pantalla.js`
- Modify: `index.html` y `proyector.html` (cargar `js/pantalla.js` justo después de `js/dom.js`), `js/proyector.js` (quitar `FRASES_ROBOT`; usar el de `pantalla.js`)
- Test: `tests/pantalla.test.js`

**Interfaces:**
- Produces en `js/pantalla.js`:
  - `PANTALLA_POR_DEFECTO` (congelado, profundo):
    ```js
    { marca:    { mostrar: true, congreso: "CONGRESO", proxy: "PROXY 2026", edicion: "EDICIÓN XV" },
      boot:     { mostrar: true },
      letrero:  { mostrar: true },
      globo:    { mostrar: true, frases: [/* las 11 frases actuales de FRASES_ROBOT, en orden */] },
      lema:     { mostrar: true, texto: "Crea, conecta y conquista." },
      cuenta:   { mostrar: true },
      prompt:   { mostrar: true, texto: "esperando al moderador" },
      marcador: { mostrar: true, texto: "PROXY 2026" },
      laptop:   { mostrar: true },
      creditos: { mostrar: true, texto: "Una actividad del Congreso PROXY 2026 · Ingeniería en Sistemas Computacionales e Informática · TecNM Instituto Tecnológico de Hermosillo" } }
    ```
  - `LIMITES_PANTALLA = { marca: 20, lema: 60, prompt: 60, frase: 80, frases: 20, marcador: 20, creditos: 200 }`.
  - `normalizarPantalla(entrada: any) → objeto con la forma exacta de PANTALLA_POR_DEFECTO`: toma cada campo de `entrada` solo si tiene el tipo correcto (`mostrar` booleano, textos string recortados con `trim()` y luego a su límite, `frases` arreglo de strings no vacíos recortados, máx. 20); cualquier otra cosa → default. Texto vacío `""` es válido (el usuario lo borró) excepto en `marcador`, `prompt` y textos de `marca`, donde vacío ⇒ default. Nunca lanza.
- Produces en `js/almacen.js`: `AlmacenPantalla = { CLAVE: "cpd_pantalla", cargar() → normalizarPantalla(Guardado.leer(...)), guardar(p), restablecer() }`. Requiere que `index.html` cargue `pantalla.js` antes de `almacen.js` (el orden "dom.js → pantalla.js" lo cumple).

- [ ] **Step 1: Pruebas que fallan** — `tests/pantalla.test.js` (carga `js/pantalla.js`):
  - `undefined, null, 5, "x", []` → cada uno `deepStrictEqual(normalizarPantalla(v), PANTALLA_POR_DEFECTO)` (comparando como JSON).
  - `{ lema: { mostrar: false } }` → `lema.mostrar === false`, `lema.texto` el default, todo lo demás default.
  - lema de 100 caracteres → longitud 60; créditos de 300 → 200; 25 frases → 20; frase de 100 → 80; frases `["", "  ", 3, "Hola"]` → `["Hola"]`.
  - `{ marcador: { texto: "" } }` → `"PROXY 2026"`; `{ lema: { texto: "" } }` → `""`.
  - `{ marca: { mostrar: "no" } }` → `marca.mostrar === true`.
  - Con `js/almacen.js` cargado también: `AlmacenPantalla.cargar()` sin clave → igual al default.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar `js/pantalla.js`, `AlmacenPantalla`, agregar los `<script>` y cambiar `proyector.js` para que su lista de frases salga de `PANTALLA_POR_DEFECTO.globo.frases` (provisional; Task 6 la conecta al estado).
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `Configuración de la pantalla del público: valores por defecto y normalización`.

---

### Task 6: Pantalla "Pantalla del público" en el panel y aplicación en el proyector

**Files:**
- Modify: `index.html` (nueva `#pantalla-publico`, botón en el menú; quitar el checkbox `#op-patrocinadores` de la configuración), `js/admin.js` (objeto nuevo `PantallaPublico`, `UI.publicar`, navegación), `proyector.html` (ids/clases para los elementos que se ocultan), `js/proyector.js` (`aplicarPantalla`), `css/estilos.css`

**Interfaces:**
- Consumes: `AlmacenPantalla`, `normalizarPantalla`, `LIMITES_PANTALLA`, `PANTALLA_POR_DEFECTO` (Task 5); `UI.config.patrocinadores`, `AlmacenConfig.guardar`.
- Produces:
  - `PantallaPublico.abrir()`, `PantallaPublico.iniciar()`; botón del menú `data-ir="publico"` con texto `"🖥 Pantalla del público"`.
  - `UI.publicar()` agrega `pantalla: AlmacenPantalla.cargar()` (o una copia en memoria que `PantallaPublico` mantiene) al estado, en todas las pantallas.
  - `Proyector.aplicarPantalla(p)` llamado desde `recibir()` con `normalizarPantalla(estado.pantalla)`.

Comportamiento:
- La pantalla del panel tiene un bloque por elemento de la tabla de la spec (sección 4), en este orden: Banner, Texto de arranque, Robot con letrero, Globo del robot (textarea, una frase por línea), Lema, Cuenta regresiva, Prompt de espera, Marca del marcador, Logo en la laptop, Créditos, Patrocinadores. Cada uno con casilla "Mostrar" y sus campos de texto con `maxlength` de `LIMITES_PANTALLA`. Botón `Restablecer valores originales` (confirma con `Modal`; también pone `patrocinadores: true`).
- Cualquier `input`/`change` guarda (`AlmacenPantalla.guardar` / `AlmacenConfig.guardar` para patrocinadores) y llama `UI.publicar()` al momento.
- Patrocinadores: el valor sigue en `UI.config.patrocinadores`; `Configuracion.abrir/enviar` dejan de leer/escribir `#op-patrocinadores` pero conservan el valor existente en `UI.config`.
- Proyector, `aplicarPantalla(p)`:
  - `hidden` en: `.marca` (portada), `pre.boot`, la imagen del robot de `.letrero-portada` (el título ASCII y "PROGRAMADORES DIJERON" siguen visibles), `#globo-robot` (también si `frases` está vacío), `.lema-proxy`, `#cuenta-inicio` (respetando que hoy además se oculta si no hay hora), `p.prompt`, `.marcador-marca`, `.laptop img`, `.creditos p`.
  - Textos con `textContent`: `.marca-congreso`, `.marca-proxy`, `.marca-edicion`, `.lema-proxy`, el texto del prompt después de `root@proxy:~$` (envolverlo en un `<span id="prompt-texto">`), `.marcador-marca span`, `.creditos p`.
  - `siguienteFrase()` usa `this.frases` (de `p.globo.frases`); si cambian las frases, reinicia `indiceFrase` en 0.
  - CSS: `.lema-proxy`, `.globo`, `.creditos p` con `overflow-wrap: anywhere` y máximo dos líneas sin desbordar el contenedor.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `node --test tests/` → PASS.
- [ ] **Step 3: Verificación manual:** abrir `index.html`, abrir proyector con ▣. En "Pantalla del público": desmarcar Banner → desaparece del proyector al momento; cambiar "PROXY 2026" a "SEMANA ISC" → se ve en el banner; borrar todas las frases → el globo se oculta; desmarcar Patrocinadores → desaparece la marquesina; iniciar una partida → el marcador y la transición respetan la configuración; terminarla → créditos con el texto editado; `Restablecer` → todo vuelve; recargar el proyector → conserva la configuración (la pide al panel).
- [ ] **Step 4:** Commit `Pantalla del público: mostrar u ocultar elementos y editar textos del proyector`.

---

### Task 7: Lista fija en la configuración + exportar/importar la preparación

**Files:**
- Modify: `index.html` (fieldset "Preguntas" de `#pantalla-config`; botones en el menú), `js/admin.js` (`Configuracion`, `UI.iniciarPartida`), `js/almacen.js` (objeto nuevo `Preparacion`), `css/estilos.css`
- Test: `tests/preparacion.test.js`

**Interfaces:**
- Consumes: `AlmacenPreguntas.resolverLista`, `porId`, `todas`, `importar` (Tasks 2–3); `Juego` con `ordenFijo` (Task 3); `AlmacenPantalla` (Task 5); `preguntasNecesarias`, `normalizarOpciones`.
- Produces en `js/almacen.js`:
  - `Preparacion.exportar() → { tipo: "100pd-preparacion", version: 1, exportadoEn: string ISO, personalizadas, cambios, config (sin "nombres"), pantalla }`.
  - `Preparacion.importar(obj) → { preguntasIgnoradas: number }`. Si `Array.isArray(obj)` → usa `AlmacenPreguntas.importar(obj)` y devuelve `{ preguntasIgnoradas: rechazadas }` (formato viejo, suma). Si `obj.tipo !== "100pd-preparacion"` → `throw new Error("El archivo no es una preparación de 100 Programadores Dijeron.")`. Si no: reemplaza personalizadas (solo las válidas por `validarDatos`; sin id ⇒ se asigna), cambios (pasados por la misma limpieza de ids de Task 2), config (`{...POR_DEFECTO, ...obj.config, nombres: los actuales}`; `categorias` filtradas a las existentes después de importar preguntas, `null` si no queda ninguna), pantalla (`normalizarPantalla`).

Comportamiento en el panel:
- Fieldset "Preguntas": radios `Al azar` / `Lista fija` (`name="modo-preguntas"`). En azar se ve lo de hoy. En lista fija se ocultan categorías/dificultad y se muestra `#lista-fija`: una fila por `preguntasNecesarias(leerOpciones())`, con etiqueta "Ronda N"/"Ronda final", un `<select>` con las preguntas activas (`todas()`, texto + categoría, con opción vacía "— elegir —") y botones `↑` `↓`. Al cambiar rondas o final, la lista se recorta o rellena con `""`. `#conteo-filtro` en lista fija dice `"${elegidas} de ${necesarias} elegidas"`.
- `Configuracion.enviar()`: en lista fija, `resolverLista(...)`; si hay errores los muestra unidos en `#error-config` y no inicia. Guarda `modoPreguntas` y `listaFija` en `UI.config`.
- `UI.iniciarPartida()`: en lista fija pasa `resolverLista(...).preguntas` y `{...config, ordenFijo: true}` a `Juego`; si hay errores (p. ej. revancha tras desactivar una), abre `Modal` "No se puede iniciar" con los errores.
- Menú: botones `⇩ Exportar preparación` (descarga `preparacion-100pd.json`, como el `exportar()` actual de `editor.js`) e `⇧ Importar preparación` (input file). Importar confirma con `Modal` ("Esto reemplaza tus preguntas, configuración y pantalla actuales"), luego muestra cuántas preguntas se ignoraron, actualiza conteo y `UI.publicar()`.

- [ ] **Step 1: Pruebas que fallan** — `tests/preparacion.test.js`:
  - `exportar e importar ida y vuelta`: en almacén A, `editar("b01", …)`, `desactivar("b02")`, `agregar(personalizada)`, `AlmacenPantalla.guardar({...default, lema:{mostrar:false, texto:"x"}})`, config con `nombres:["X","Y"]`; `exportar()` no contiene `nombres`; importarlo en almacén B (con `nombres:["P","Q"]`) → B tiene la misma `catalogo()` (ids y estados), mismo lema, y `nombres` sigue `["P","Q"]`.
  - `formato viejo suma`: `importar([preguntaValida])` → 28 activas.
  - `archivo ajeno lanza`: `importar({hola:1})` lanza con el mensaje exacto.
  - `datos dañados se ignoran`: `{tipo:"100pd-preparacion", version:1, personalizadas:[{pregunta:"mala"}, valida], cambios:{editadas:{zz:{}}}, config:{categorias:["NoExiste"]}, pantalla:"basura"}` → `preguntasIgnoradas === 1`, 28 activas, `AlmacenConfig.cargar().categorias === null`, pantalla igual al default.
- [ ] **Step 2:** `node --test tests/` → FAIL.
- [ ] **Step 3:** Implementar `Preparacion` y la UI.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5: Verificación manual:** lista fija de 4 preguntas elegidas → la partida sale en ese orden y la 4.ª es la ronda final; desactivar una de la lista en el Banco y volver a "¡A jugar!" → error "La pregunta de la ronda N ya no está disponible…"; exportar, borrar los datos del sitio en el navegador, importar → todo vuelve.
- [ ] **Step 6:** Commit `Lista fija en la configuración y exportar/importar la preparación`.

---

### Task 8: Documentación

**Files:**
- Modify: `README.md` (sección "Cómo agregar preguntas" → "Banco de preguntas"; nueva sección "Pantalla del público"; "Preparar un evento" con exportar/importar; cómo correr `node --test tests/`; nota sobre `id` al agregar preguntas a `preguntas.js`)

- [ ] **Step 1:** Actualizar `README.md`.
- [ ] **Step 2:** `node --test tests/` → PASS.
- [ ] **Step 3:** Commit `README: banco de preguntas, pantalla del público y preparación de eventos`.
