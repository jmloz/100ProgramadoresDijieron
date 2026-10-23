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

## Estructura

```
index.html          PANEL DEL MODERADOR: menú, configuración, controles, tarjeta de respuestas, editor
proyector.html      PANTALLA DEL PÚBLICO: tablero, marcador, errores y ganador (sin controles)
css/estilos.css     Tema visual de ambas ventanas: juego indie pixel art con los colores del Congreso PROXY
fonts/              Fuentes locales (Chakra Petch, Press Start 2P, IBM Plex Mono; licencia OFL): no necesita internet
img/                Logos del Congreso PROXY 2026 (X y wordmark)
js/dom.js           Utilidades de DOM compartidas y la mascota (robotcito pixel art que reacciona al juego)
js/canal.js         Comunicación panel <-> proyector (postMessage + BroadcastChannel)
js/preguntas.js     BANCO DE PREGUNTAS (aquí se agregan preguntas fijas)
js/validador.js     Normaliza y compara respuestas (acentos, mayúsculas, sinónimos, errores de dedo)
js/modelos.js       Clases Respuesta, Pregunta y Equipo
js/juego.js         Clase Juego: reglas y fases de la ronda (sin nada de interfaz)
js/almacen.js       Lo que se guarda en el navegador: preguntas agregadas, configuración y partida en curso
js/sonidos.js       Efectos chiptune (8 bits): inicio, acierto, error, revelar, ronda, ganador, tic y fin de tiempo
js/temporizador.js  Cuenta regresiva con pausa (la usa el panel)
js/editor.js        Pantalla "Agregar pregunta"
js/admin.js         Panel: conecta los controles con Juego y envía el estado al proyector
js/proyector.js     Proyector: dibuja el estado que recibe del panel
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
  letrero, ~10 s; corta: solo el letrero, ~4 s; o sin animación) y si se muestran los patrocinadores.
- **Tiempo para responder** en el cara a cara y en los turnos/robo (0 = sin tiempo). Si se acaba, cuenta
  como error. El tiempo se ve en ambas ventanas, suena un tic en los últimos 5 segundos y se pausa solo
  mientras el moderador decide una respuesta dudosa.
- **Categorías** (Programación, Lenguajes, Vida estudiantil, Cultura dev y las que agregues) y **dificultad**.
  El juego avisa si con ese filtro no alcanzan las 4 preguntas de una partida.

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

- 2 equipos, 3 rondas normales + 1 ronda final (puntos x2). Preguntas al azar y sin repetir.
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

## Cómo agregar preguntas

**Opción 1 — Desde el juego:** menú → *Agregar pregunta*. Se guardan en el navegador
(`localStorage`). Con *Exportar JSON* / *Importar JSON* las pasas a otra computadora.

**Opción 2 — En el código (permanente):** abre `js/preguntas.js` y agrega un bloque dentro del arreglo
`PREGUNTAS_BASE` (no olvides la coma entre bloques):

```js
    {
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

Reglas: de 5 a 8 respuestas, puntos enteros positivos, suma máxima 100. En el tablero solo salen las **5 más
populares** (`RESPUESTAS_POR_RONDA` en `js/modelos.js`); las demás no cuentan. `categoria` es libre (si la omites
queda en "General") y `dificultad` puede ser `"facil"`, `"media"` o `"dificil"` (por defecto `"media"`). El orden no importa
(el juego las ordena por puntaje). Si una pregunta tiene errores, el juego la ignora y lo avisa en la
consola del navegador (F12).
