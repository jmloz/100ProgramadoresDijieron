# 100 PROGRAMADORES DIJERON

Versión estudiantil de "100 mexicanos dijeron" con humor de ingeniería en sistemas.
Hecho en **HTML + CSS + JavaScript puro**: no requiere instalar, compilar ni usar servidor.

## Cómo ejecutarlo

El juego usa **dos ventanas** en la misma computadora (laptop conectada al proyector como pantalla extendida):

| Ventana | Archivo | Quién la ve |
|---------|---------|-------------|
| Panel del moderador | `index.html` | Solo el moderador (en la laptop): menú, controles y la tarjeta con todas las respuestas |
| Proyector | `proyector.html` | El público: tablero, marcador, errores, turno y pantalla del ganador |

1. Descarga o copia la carpeta completa del proyecto.
2. Abre `index.html` con doble clic (Chrome, Edge o Firefox).
3. Presiona **📽 Abrir proyector**. Si el navegador bloquea la ventana emergente, permítela.
4. Arrastra la ventana del proyector a la pantalla del proyector y haz **doble clic** en ella para ponerla
   en pantalla completa.
5. Juega desde el panel: el proyector se actualiza solo. En la **tarjeta del moderador** puedes hacer clic en
   una respuesta para aceptarla, o escribir lo que dijo el jugador.

Si el proyector se cierra o se recarga, vuelve a abrirlo con el mismo botón y recupera el estado de la partida.
Si el que se cierra es el **panel**, la partida se guarda sola: al volver a abrir `index.html` aparece
**⏯ Continuar partida** en el menú.
El proyector nunca recibe el texto de las respuestas ocultas, así que no hay forma de "espiarlas".

> Opcional: también puedes servirlo con `python3 -m http.server` y abrir `http://localhost:8000`.

Los sonidos se generan con Web Audio API y suenan desde el panel (misma computadora, mismas bocinas).
El botón 🔊 de la barra superior los silencia.

## Estructura

```
index.html          PANEL DEL MODERADOR: menú, configuración, controles, tarjeta de respuestas, editor
proyector.html      PANTALLA DEL PÚBLICO: tablero, marcador, errores y ganador (sin controles)
css/estilos.css     Tema visual de ambas ventanas (tablero, marcador, animaciones)
js/dom.js           Utilidades de DOM compartidas
js/canal.js         Comunicación panel <-> proyector (postMessage + BroadcastChannel)
js/preguntas.js     BANCO DE PREGUNTAS (aquí se agregan preguntas fijas)
js/validador.js     Normaliza y compara respuestas (acentos, mayúsculas, sinónimos, errores de dedo)
js/modelos.js       Clases Respuesta, Pregunta y Equipo
js/juego.js         Clase Juego: reglas y fases de la ronda (sin nada de interfaz)
js/almacen.js       Lo que se guarda en el navegador: preguntas agregadas, configuración y partida en curso
js/sonidos.js       Efectos de acierto, error, revelar, ganador, tic y fin de tiempo
js/temporizador.js  Cuenta regresiva con pausa (la usa el panel)
js/editor.js        Pantalla "Agregar pregunta"
js/admin.js         Panel: conecta los controles con Juego y envía el estado al proyector
js/proyector.js     Proyector: dibuja el estado que recibe del panel
```

## Configurar la partida

Al presionar **▶ Jugar** se eligen:

- **Nombres de los equipos.**
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

Reglas: de 5 a 8 respuestas, puntos enteros positivos, suma máxima 100. `categoria` es libre (si la omites
queda en "General") y `dificultad` puede ser `"facil"`, `"media"` o `"dificil"` (por defecto `"media"`). El orden no importa
(el juego las ordena por puntaje). Si una pregunta tiene errores, el juego la ignora y lo avisa en la
consola del navegador (F12).
