# 100 PROGRAMADORES DIJERON

Versión estudiantil de "100 mexicanos dijeron" con humor de ingeniería en sistemas.
Hecho en **HTML + CSS + JavaScript puro**: no requiere instalar, compilar ni usar servidor.

## Cómo ejecutarlo

1. Descarga o copia la carpeta completa del proyecto.
2. Abre `index.html` con doble clic (Chrome, Edge o Firefox).
3. Para proyectarlo en clase, presiona **F11** (pantalla completa).

> Opcional: también puedes servirlo con `python3 -m http.server` y abrir `http://localhost:8000`.

Los sonidos se generan con Web Audio API, así que no se necesitan archivos de audio.
El botón 🔊 de la esquina silencia el juego.

## Estructura

```
index.html          Pantallas: menú, configuración, juego, agregar pregunta, instrucciones, final
css/estilos.css     Tema visual (tablero, marcador, animaciones)
js/preguntas.js     BANCO DE PREGUNTAS (aquí se agregan preguntas fijas)
js/validador.js     Normaliza y compara respuestas (acentos, mayúsculas, sinónimos, errores de dedo)
js/modelos.js       Clases Respuesta, Pregunta y Equipo
js/juego.js         Clase Juego: reglas y fases de la ronda (sin nada de interfaz)
js/almacen.js       Preguntas agregadas desde el menú (se guardan en el navegador)
js/sonidos.js       Efectos de acierto, error, revelar y ganador
js/ui.js            Interfaz: dibuja el tablero y conecta botones con Juego
```

## Reglas implementadas

- 2 equipos, 3 rondas normales + 1 ronda final (puntos x2). Preguntas al azar y sin repetir.
- **Cara a cara:** el moderador marca quién presionó primero. La respuesta #1 gana el control de inmediato;
  si no, responde el otro equipo y gana quien tenga la respuesta con más puntos. Si los dos fallan, pasan
  otros dos representantes.
- El ganador decide **jugar o pasar**.
- Cada acierto suma al banco. Con **3 errores** el otro equipo tiene **una** oportunidad de robar.
- Una respuesta que ya está en el tablero no cuenta como error.

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

Reglas: de 5 a 8 respuestas, puntos enteros positivos, suma máxima 100. El orden no importa
(el juego las ordena por puntaje). Si una pregunta tiene errores, el juego la ignora y lo avisa en la
consola del navegador (F12).
