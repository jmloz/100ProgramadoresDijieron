# 100 PROGRAMADORES DIJERON

Versión estudiantil de "100 mexicanos dijeron" con humor de ingeniería en sistemas.
Hecho en **HTML + CSS + JavaScript puro**: no requiere instalar, compilar ni usar servidor.

## ▶ Jugar en línea

**https://jmloz.github.io/100ProgramadoresDijieron/**

Abre el enlace en la computadora conectada al proyector: esa página es el panel del moderador y desde su
botón **▣ Abrir proyector** se abre la pantalla para el público. También puedes descargar el proyecto y
abrir `index.html` sin internet (ver abajo).

## Cómo ejecutarlo

El juego usa **dos ventanas** en la misma computadora (laptop conectada al proyector como pantalla extendida):

| Ventana | Archivo | Quién la ve |
|---------|---------|-------------|
| Panel del moderador | `index.html` | Solo el moderador (en la laptop): menú, controles y la tarjeta con todas las respuestas |
| Proyector | `proyector.html` | El público: tablero, marcador, errores, turno y pantalla del ganador |

1. Descarga o copia la carpeta completa del proyecto.
2. Abre `index.html` con doble clic (Chrome, Edge o Firefox).
3. Presiona **▣ Abrir proyector**. Si el navegador bloquea la ventana emergente, permítela.
4. Arrastra la ventana del proyector a la pantalla del proyector y haz **doble clic** en ella para ponerla
   en pantalla completa.
5. Juega desde el panel: el proyector se actualiza solo. En la **tarjeta del moderador** puedes hacer clic en
   una respuesta para aceptarla, o escribir lo que dijo el jugador.

Si el proyector se cierra o se recarga, vuelve a abrirlo con el mismo botón y recupera el estado de la partida.
Si el que se cierra es el **panel**, la partida se guarda sola: al volver a abrir `index.html` aparece
**⏯ Continuar partida** en el menú.
El proyector nunca recibe el texto de las respuestas ocultas, así que no hay forma de "espiarlas".

> Opcional: también puedes servirlo con `python3 -m http.server` y abrir `http://localhost:8000`.

Los sonidos (estilo chiptune de 8 bits) se generan con Web Audio API y suenan desde el panel (misma computadora, mismas bocinas).
El botón 🔊 de la barra superior los silencia.

## Usarlo con OBS

OBS no permite abrir ventanas emergentes, y una **Fuente de navegador** de OBS es otro programa: no puede
recibir mensajes del panel abierto en Chrome. Para eso está el **servidor local** (`servidor-obs.ps1`), que usa
PowerShell (ya viene con Windows, no hay que instalar nada) y pasa los mensajes entre el panel y el proyector.

1. Doble clic en **`iniciar-servidor.bat`**. Pregunta el **puerto**: presiona **Enter** para usar el 8100 o escribe
   otro (de 1024 a 65535). Deja abierta esa ventana negra mientras dure el juego.
2. **Panel del moderador:** abre **http://localhost:8100/** en Chrome o Edge (no `index.html` con doble clic).
3. **En OBS:** *Fuentes → + → Navegador* con:
   - **URL:** `http://localhost:8100/proyector.html` (deja **sin marcar** "Archivo local")
   - **Ancho / Alto:** `1920` × `1080` (o la resolución del lienzo de OBS)
   - Desmarca *"Apagar la fuente cuando no esté visible"* y *"Actualizar navegador cuando la escena se active"*,
     para que no se pierda la animación al cambiar de escena.
4. En el panel debe aparecer **● Proyector conectado**. Si no, en OBS: clic derecho en la fuente → *Actualizar*.

El proyector detecta que está dentro de OBS: oculta el aviso de "arrastra esta ventana" y el cursor.

- **Sonidos:** el botón **🔈 Suena aquí / 📺 Suena en proyector** de la barra del panel elige dónde suenan los
  efectos y la música. Con el panel en la misma computadora que OBS suenan ahí y entran por *Audio del escritorio*.
- **Otro puerto:** si el que elegiste está ocupado, la ventana avisa y pregunta otro. Si no usas el 8100, cambia
  el número en las direcciones del panel y de la fuente de OBS (la ventana negra muestra las correctas).
  También se puede dar sin que pregunte: `iniciar-servidor.bat 8200`.
- Las preguntas agregadas y la configuración se guardan por dirección: las de `index.html` abierto con doble
  clic no aparecen en `http://localhost:8100/`. Pásalas con *Exportar preparación* / *Importar preparación* (menú).
- **Alternativa sin servidor:** abre el proyector en Chrome con el botón ▣ y en OBS agrega una fuente
  *Captura de ventana* de esa ventana (método de captura "Windows 10 (1903 y posterior)").

### Panel en el celular (o en otra computadora)

El moderador puede llevar el panel en el celular mientras OBS corre en la computadora del evento.

1. En la computadora de OBS, doble clic en **`iniciar-servidor-red.bat`** (en vez de `iniciar-servidor.bat`).
   Windows pide permiso de administrador: acéptalo. La primera vez se abre el puerto en el firewall
   **solo para la red local** (regla `100ProgramadoresDijeron-8100`).
2. La ventana negra muestra en verde la dirección del panel, por ejemplo **`http://192.168.1.68:8100/`**.
   Ábrela en el navegador del celular, conectado **a la misma red wifi** que la computadora.
3. En OBS el proyector se agrega igual que arriba, con `http://localhost:8100/proyector.html`.

Abierto desde el celular, el panel manda los sonidos y la música **al proyector** (botón *📺 Suena en
proyector*): suenan en la computadora de OBS y no en la bocina del celular. En el celular no hay atajos de
teclado; todo se hace con los botones y tocando las respuestas de la tarjeta del moderador.

Si el celular no carga la página:
- Revisa que esté en la misma red (no en datos móviles) y que la computadora no esté en una red "Pública" con
  aislamiento de clientes (algunas redes de escuelas y congresos lo tienen: en ese caso usa un hotspot propio).
- Bloquea la pantalla del celular lo menos posible: al bloquearse, el navegador pausa la página. Al volver se
  reconecta solo.

## Estructura

```
index.html          PANEL DEL MODERADOR: menú, configuración, controles, tarjeta de respuestas, banco y pantalla del público
proyector.html      PANTALLA DEL PÚBLICO: tablero, marcador, errores y ganador (sin controles)
css/estilos.css     Tema visual de ambas ventanas: juego indie pixel art con los colores del Congreso PROXY
fonts/              Fuentes locales (Chakra Petch, Press Start 2P, IBM Plex Mono; licencia OFL): no necesita internet
img/                Logos del Congreso PROXY 2026 (X y wordmark)
js/dom.js           Utilidades de DOM compartidas y la mascota (robotcito pixel art que reacciona al juego)
js/canal.js         Comunicación panel <-> proyector (postMessage + BroadcastChannel + servidor local)
servidor-obs.ps1    Servidor local para usar el proyector como Fuente de navegador en OBS
iniciar-servidor.bat  Lo inicia con doble clic (solo esta computadora)
iniciar-servidor-red.bat  Lo inicia para abrir el panel desde el celular (misma red)
js/preguntas.js     BANCO BASE: preguntas fijas del proyecto (cada una con su id)
js/validador.js     Normaliza y compara respuestas (acentos, mayúsculas, sinónimos, errores de dedo)
js/modelos.js       Clases Respuesta, Pregunta y Equipo
js/juego.js         Clase Juego: reglas y fases de la ronda (sin nada de interfaz)
js/almacen.js       Lo que se guarda en el navegador: banco (preguntas propias y cambios a las base), configuración,
                    pantalla del público, lista fija y partida en curso
js/sonidos.js       Efectos chiptune (8 bits): inicio, acierto, error, revelar, ronda, ganador, tic y fin de tiempo
js/temporizador.js  Cuenta regresiva con pausa (la usa el panel)
js/editor.js        Pantalla "Banco de preguntas": lista, búsqueda, editar, duplicar, desactivar, borrar y restaurar
js/admin.js         Panel: conecta los controles con Juego y envía el estado al proyector
js/proyector.js     Proyector: dibuja el estado que recibe del panel
js/pantalla.js       Pantalla del público: valores por defecto, límites de texto y normalización
tests/               Pruebas automáticas (`node --test tests/`)
```

## Tema visual (Congreso PROXY 2026)

Pensado para proyectarse en un auditorio: fondo azul marino (los proyectores no dan negro real), texto claro
de alto contraste, acentos azul/cian/violeta de PROXY y amarillo solo para los puntos. Sin brillos ni
líneas de barrido, que se ven borrosos o hacen moiré al proyectarse.

- **Mascota en pixel art:** versión pixel del robot-venado en `js/dom.js` (`ROBOT`). Cambia de cara:
  feliz cuando se descubre una respuesta, ojos en X cuando hay error, y celebra en la pantalla final.
- **Show:** cada ronda empieza con una animación: el robot teclea en su laptop mientras una terminal "compila"
  la ronda (con su barra de progreso y sonidos sincronizados), y luego baja con el letrero "RONDA N" (o
  "¡RONDA FINAL!") y los patrocinadores. Los tiempos están en `TRANSICION` (`js/proyector.js`); los puntos y el banco cuentan hacia arriba; al destapar todo el tablero o robar el banco
  el robot festeja con lluvia de ceros y unos; la pantalla final incluye créditos y patrocinadores.
- **Portada del proyector:** el robot dice frases que rotan, hay una tira de patrocinadores en movimiento y,
  si el moderador pone la **hora de inicio** en el menú, una cuenta regresiva.
- **Música chiptune** de fondo (botón ♫ del panel), generada en vivo con Web Audio; baja sola con los efectos.
- **Tema claro** (botón ☀ del panel) para auditorios con luz encendida; el proyector cambia también.
- **Patrocinadores:** logos en `img/patrocinadores/` y la lista en `PATROCINADORES` (`js/dom.js`).
- **Imágenes de congresoproxy.com:** `img/proxy-logo.webp` (logo X), `img/robot-letrero.webp` y `img/robot-corona.webp`
  (robot-venado oficial; en la portada sostiene el título y en el final el nombre del ganador) e `img/fondo.webp`.

## Configurar la partida

Al presionar **▶ Jugar** se eligen:

- **Nombres de los equipos.**
- **Reglas:** rondas normales (1 a 8, una pregunta cada una), ronda final (x2, x3 o sin final), respuestas en el
  tablero (3 a 8; si una pregunta tiene menos, se muestran las que tenga) y errores para perder el control (1 a 5).
- **Presentación:** animación entre rondas (larga: el robot "programa" la ronda en su laptop y luego muestra el
  letrero, ~10 s; corta: solo el letrero, ~4 s; o sin animación). Los patrocinadores se controlan en *Pantalla del público*.
- **Tiempo para responder** en el cara a cara y en los turnos/robo (0 = sin tiempo). Si se acaba, cuenta
  como error. El tiempo se ve en ambas ventanas, suena un tic en los últimos 5 segundos y se pausa solo
  mientras el moderador decide una respuesta dudosa.
- **Preguntas:** al azar (con las **categorías** —Programación, Lenguajes, Vida estudiantil, Cultura dev y las que agregues— y la **dificultad**) o **lista fija**, eligiendo cada pregunta. Ver *Preguntas de la partida*.

La configuración se recuerda para la siguiente vez.

## Atajos de teclado del panel

| Tecla | Acción |
|-------|--------|
| `1` – `8` | Aceptar la respuesta con ese número |
| `X` | Marcar error |
| `T` / `Enter` | Escribir lo que dijo el jugador (`Esc` para volver a los atajos) |
| `←` / `→` | Cara a cara: quién presionó primero |
| `J` / `P` | Jugar o pasar |
| `R` | Revelar las respuestas restantes al final de la ronda |
| `Enter` | Siguiente ronda |
| `Espacio` | Pausar o reanudar el tiempo |
| `Ctrl` + `Z` | **Deshacer** la última acción (hasta 100 pasos) |

## Reglas implementadas

- 2 equipos, 3 rondas normales + 1 ronda final (puntos x2). Preguntas al azar y sin repetir, o la lista fija que elijas.
- **Cara a cara:** el moderador marca quién presionó primero. La respuesta #1 gana el control de inmediato;
  si no, responde el otro equipo y gana quien tenga la respuesta con más puntos. Si los dos fallan, pasan
  otros dos representantes.
- El ganador decide **jugar o pasar**.
- Cada acierto suma al banco. Con **3 errores** el otro equipo tiene **una** oportunidad de robar.
- Una respuesta que ya está en el tablero no cuenta como error.
- Si se acaba el tiempo para responder, cuenta como error.

## Validación de respuestas

| Lo que se escribe        | Resultado                                                        |
|--------------------------|------------------------------------------------------------------|
| `  STACK   overflów `    | Se acepta (ignora mayúsculas, acentos y espacios)                 |
| `so`, `stackoverflow`    | Se acepta si está en los `alias`                                  |
| `gogle`, `chatgtp`       | **Dudosa**: el moderador decide si la acepta                      |
| `pues buscar en google`  | **Dudosa**: contiene una respuesta; el moderador confirma         |
| `pizza`                  | No coincide: el moderador confirma el error o la acepta manualmente |

## Banco de preguntas

Desde el menú → **☰ Banco de preguntas** ves todas las preguntas: las base de `js/preguntas.js` y las que
agregaste en el panel. Arriba aparece el conteo; con la búsqueda (texto de la pregunta o de las respuestas)
y los filtros de categoría, dificultad y estado encuentras cualquiera.

Cada pregunta muestra una etiqueta de estado (las base sin cambios no llevan ninguna):

| Etiqueta | Significado |
|----------|-------------|
| *(ninguna)* | Pregunta base sin cambios |
| **Editada** | Pregunta base con cambios hechos en el panel |
| **Tuya** | Pregunta agregada desde el panel |
| **Desactivada** | No sale en las partidas, pero sigue en el banco |
| **Borrada** | Pregunta base borrada (solo se ve con el filtro *Borradas*) |

Acciones por pregunta:

- **Editar:** cambia pregunta, categoría, dificultad, respuestas, puntos y sinónimos.
- **Duplicar:** abre el formulario con una copia (*"(copia)"* al final) que se guarda como pregunta tuya nueva.
- **Desactivar / Activar:** la quita o la vuelve a poner en el juego sin borrarla.
- **Borrar:** pide confirmación. Borrar una pregunta **base** es reversible (**Restaurar original**);
  borrar una **tuya** es definitivo.
- **Restaurar original:** deshace las ediciones de una base o la vuelve a poner si estaba borrada. Si su
  texto ya lo usa otra pregunta, no se restaura y el aviso lo indica.

Reglas del formulario: de **5 a 8 respuestas**, puntos enteros positivos y suma máxima de **100** (la suma
se va calculando mientras escribes). En el tablero solo salen las N respuestas con más puntos, donde N es
la cantidad de respuestas configurada en la partida. No puede haber dos preguntas con el mismo texto.

Los cambios a preguntas base se guardan en el navegador, **no** modifican `js/preguntas.js`, y las preguntas
que agregues al archivo más adelante siguen apareciendo solas. Las partidas guardadas no se afectan.

## Preguntas de la partida

En **▶ Jugar**, la sección *Preguntas* elige cómo se llenan las rondas:

- **Al azar** (por defecto): el juego saca preguntas de las categorías y la dificultad que elijas, sin repetir.
  Avisa si con ese filtro no alcanzan las preguntas que necesita la partida.
- **Lista fija:** tú eliges la pregunta de cada ronda, en orden. Hay una casilla por ronda normal y una
  para la ronda final. Cada casilla es una lista desplegable con las preguntas activas; con ↑ y ↓ cambias
  el orden, y «— elegir —» deja la casilla vacía. Los filtros de categoría y dificultad se ocultan en este modo.
  Antes de iniciar, el juego revisa que no haya casillas vacías, preguntas repetidas ni preguntas que ya
  estén desactivadas o borradas, y te dice cuál es el problema. Si cambias el número de rondas, la lista se
  recorta o agrega casillas vacías.

## Pantalla del público

Desde el menú → **🖥 Pantalla del público** configuras lo que se ve en el proyector. Los cambios se aplican
al momento, así que puedes verlos en el proyector mientras preparas el evento.

- **Mostrar u ocultar** cada elemento: banner de marca, texto de arranque tipo BIOS, robot con letrero,
  globo del robot, lema, cuenta regresiva, prompt de espera, marca del marcador, logo de la laptop y
  créditos de la pantalla final. El título del juego se queda visible aunque ocultes el robot.
- **Textos editables:** las tres líneas del banner (texto superior, principal y edición), las frases del
  globo (una por línea; vacío = sin globo), el lema, el prompt de espera, la marca del marcador y los créditos.
- **Límites de largo:** banner y marca del marcador 20 letras; lema y prompt 60; cada frase del globo 80
  (máximo 20 frases); créditos 200.
- **Patrocinadores:** la casilla *Mostrar* está aquí. Es todo
  o nada: se muestran en la portada, entre rondas y al final.
- **Restablecer valores originales** devuelve todo lo de esta pantalla a los valores por defecto. No toca
  el banco de preguntas.

## Preparar un evento

Para reutilizar el juego en otro evento, prepara todo en un solo archivo:

1. En el menú, **⇩ Exportar preparación** descarga `preparacion-100pd.json` con tus preguntas propias, los
   cambios al banco, la configuración de la partida y la pantalla del público. **No** incluye los nombres de
   los equipos, porque cambian en cada partida.
2. En la otra computadora, **⇧ Importar preparación** pide confirmación y **reemplaza** lo que haya en esa
   computadora: preguntas propias, cambios al banco, configuración y pantalla del público. Los nombres de
   los equipos se conservan. Las preguntas no válidas se omiten y el aviso dice cuántas.
3. Los archivos del formato anterior (un arreglo de preguntas, como los de la versión vieja) también se
   pueden importar: en ese caso las preguntas se **suman** a las que ya tienes.

Las preguntas base siempre vienen de `js/preguntas.js` del mismo proyecto, así que la otra computadora debe
tener la misma versión del juego.

## Agregar preguntas al código (permanente)

Para que una pregunta forme parte del proyecto, abre `js/preguntas.js` y agrega un bloque dentro del arreglo
`PREGUNTAS_BASE` (no olvides la coma entre bloques). Cada pregunta necesita un **`id`** único y fijo, con la
siguiente letra y número libres (`b28`, `b29`…). No lo cambies ni lo reutilices: las ediciones del banco se
guardan por ese id.

```js
    {
        id: "b28",
        categoria: "Programación",
        dificultad: "media",
        pregunta: "Algo que se rompe un viernes a las 5 de la tarde",
        respuestas: [
            { texto: "Producción", puntos: 40, alias: ["prod", "el servidor de produccion"] },
            { texto: "La base de datos", puntos: 25, alias: ["bd", "db", "base de datos"] },
            { texto: "El build", puntos: 15, alias: ["compilacion", "pipeline", "ci"] },
            { texto: "El wifi", puntos: 12, alias: ["internet", "red"] },
            { texto: "Mi espíritu", puntos: 8, alias: ["mi alma", "mi corazon", "yo"] }
        ]
    },
```

Reglas: de 5 a 8 respuestas, puntos enteros positivos, suma máxima 100. En el tablero salen las más
populares: **5 por defecto**, configurable de 3 a 8 en la pantalla de configuración (`RESPUESTAS_POR_RONDA` en `js/modelos.js` es el valor por defecto); las demás no cuentan. `categoria` es libre (si la omites
queda en "General") y `dificultad` puede ser `"facil"`, `"media"` o `"dificil"` (por defecto `"media"`). El orden no importa
(el juego las ordena por puntaje). Si una pregunta tiene errores, el juego la ignora y lo avisa en la
consola del navegador (F12).

## Pruebas

El proyecto tiene pruebas automáticas de la lógica del juego (banco, almacén, pantalla del público, juego y
preparación de eventos), sin dependencias. Con **Node.js 20 o superior** y desde la carpeta del proyecto:

```bash
node --test tests/
```

Deben salir todas en verde. Las pruebas no revisan la interfaz: los cambios visuales se revisan en el navegador.
