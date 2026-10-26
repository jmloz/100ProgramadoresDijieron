/*
 * ============================================================
 *  BANCO DE PREGUNTAS - 100 PROGRAMADORES DIJERON
 * ============================================================
 *  Para agregar una pregunta, copia un bloque { ... } y edítalo.
 *
 *  Reglas:
 *   - "categoria": tema de la pregunta (para filtrar al configurar la partida).
 *   - "dificultad": "facil", "media" o "dificil".
 *   - "pregunta": el texto que se muestra en pantalla.
 *   - "respuestas": entre 5 y 8 respuestas. En el tablero solo salen
 *                   las 5 con más puntos (RESPUESTAS_POR_RONDA en modelos.js).
 *       - "texto":  lo que aparece en el tablero al revelarse.
 *       - "puntos": entero positivo. La suma total no debe pasar de 100.
 *       - "alias":  (opcional) sinónimos o variantes aceptadas.
 *                   No importan mayúsculas, acentos ni espacios.
 *   - No hace falta ordenar las respuestas: el juego las ordena
 *     de mayor a menor puntaje automáticamente.
 *
 *  Este archivo es un .js (y no .json) para que funcione al abrir
 *  index.html directamente, sin servidor web.
 * ============================================================
 */
const PREGUNTAS_BASE = [
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Menciona una excusa para no entregar la tarea",
        respuestas: [
            { texto: "Se me fue el internet", puntos: 28, alias: ["internet", "se fue el internet", "no tenia internet", "sin internet", "wifi", "se cayo el internet", "no tenia datos", "datos"] },
            { texto: "Se me olvidó", puntos: 20, alias: ["se me olvido", "olvide", "me olvide", "no me acorde", "olvido"] },
            { texto: "No sabía que había tarea", puntos: 14, alias: ["no sabia", "no sabia que habia tarea", "no la vi", "no vi el classroom", "classroom", "no me avisaron", "nadie me dijo", "no estaba en el grupo"] },
            { texto: "Se descompuso la compu", puntos: 12, alias: ["se descompuso la computadora", "compu", "computadora", "laptop", "se murio la compu", "virus", "se me borro el archivo", "se borro"] },
            { texto: "No le entendí", puntos: 10, alias: ["no entendi", "no le entendi", "no entendi las instrucciones", "instrucciones"] },
            { texto: "Se fue la luz", puntos: 9, alias: ["luz", "apagon", "no habia luz", "sin luz"] },
            { texto: "Estaba enfermo", puntos: 7, alias: ["enfermo", "me enferme", "enfermedad", "estaba enferma", "enferma"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "facil",
        pregunta: "Lo primero que haces cuando tu código no compila",
        respuestas: [
            { texto: "Preguntarle a ChatGPT", puntos: 30, alias: ["chatgpt", "chat gpt", "gpt", "chat", "ia", "ai", "inteligencia artificial", "preguntarle a la ia", "gemini", "claude", "copilot"] },
            { texto: "Leer el error", puntos: 20, alias: ["leo el error", "error", "ver el error", "leer el mensaje", "mensaje de error"] },
            { texto: "Buscar en Google", puntos: 15, alias: ["google", "buscar", "googlear", "stack overflow", "internet", "buscarlo", "youtube"] },
            { texto: "Revisar el punto y coma", puntos: 12, alias: ["punto y coma", "punto coma", "semicolon", "buscar el punto y coma"] },
            { texto: "Volver a correrlo", puntos: 9, alias: ["correrlo otra vez", "volver a compilar", "compilar otra vez", "recompilar", "darle run otra vez", "run", "volverlo a correr"] },
            { texto: "Preguntarle a un compa", puntos: 8, alias: ["compa", "compañero", "amigo", "preguntarle a alguien", "preguntar a un compañero", "al compa"] },
            { texto: "Llorar", puntos: 6, alias: ["lloro", "chillar", "llorar un rato"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "media",
        pregunta: "Menciona el lenguaje de programación más odiado",
        respuestas: [
            { texto: "Ensamblador", puntos: 26, alias: ["assembly", "asm", "lenguaje ensamblador", "emu8086"] },
            { texto: "Java", puntos: 20, alias: [] },
            { texto: "C++", puntos: 16, alias: ["cpp", "c plus plus", "c mas mas"] },
            { texto: "JavaScript", puntos: 13, alias: ["js", "java script"] },
            { texto: "PHP", puntos: 10, alias: [] },
            { texto: "Prolog / Lisp", puntos: 8, alias: ["prolog", "lisp", "haskell", "scheme", "programacion logica", "programacion funcional"] },
            { texto: "C", puntos: 7, alias: ["lenguaje c"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "facil",
        pregunta: "Menciona el lenguaje favorito de los estudiantes de sistemas",
        respuestas: [
            { texto: "Python", puntos: 34, alias: ["piton"] },
            { texto: "JavaScript", puntos: 18, alias: ["js", "java script"] },
            { texto: "Java", puntos: 15, alias: [] },
            { texto: "C#", puntos: 12, alias: ["csharp", "c sharp", "c gato"] },
            { texto: "C++", puntos: 10, alias: ["cpp", "c plus plus", "c mas mas"] },
            { texto: "PHP", puntos: 6, alias: [] },
            { texto: "C", puntos: 5, alias: ["lenguaje c"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que hay en la mochila de un estudiante de sistemas",
        respuestas: [
            { texto: "Laptop", puntos: 30, alias: ["computadora", "compu", "lap", "portatil", "pc"] },
            { texto: "Cargador", puntos: 20, alias: ["charger", "cable", "cargador de la laptop", "cargador de la compu"] },
            { texto: "Audífonos", puntos: 14, alias: ["audifonos", "headphones", "audios", "cascos", "auriculares"] },
            { texto: "Agua / termo", puntos: 11, alias: ["agua", "termo", "botella", "botella de agua", "hielera"] },
            { texto: "Mouse", puntos: 9, alias: ["raton"] },
            { texto: "Cuaderno sin usar", puntos: 8, alias: ["cuaderno", "libreta"] },
            { texto: "Memoria USB", puntos: 8, alias: ["usb", "memoria", "pendrive"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que un estudiante de sistemas escucha de su familia",
        respuestas: [
            { texto: "Arréglame la compu", puntos: 30, alias: ["arreglame la computadora", "arregla la compu", "arregla la computadora", "compu", "computadora", "instalame office"] },
            { texto: "Arréglame el celular", puntos: 20, alias: ["arregla el celular", "celular", "cel", "el telefono", "arreglame el cel"] },
            { texto: "Ponme el wifi", puntos: 13, alias: ["wifi", "internet", "el internet", "contraseña del wifi", "arregla el internet"] },
            { texto: "¿Me hackeas el Face?", puntos: 12, alias: ["hackear", "hackeame el face", "hackear facebook", "hackeas", "facebook", "face", "hacker"] },
            { texto: "Arregla la impresora", puntos: 10, alias: ["impresora", "la impresora"] },
            { texto: "Te la pasas en la compu", puntos: 9, alias: ["siempre en la compu", "solo juegas", "te la pasas jugando", "deja la compu"] },
            { texto: "¿Y eso para qué sirve?", puntos: 6, alias: ["para que sirve", "eso para que sirve", "que haces", "y de que vas a trabajar"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Menciona un editor o IDE que usan los programadores",
        respuestas: [
            { texto: "VS Code", puntos: 40, alias: ["vscode", "visual studio code", "code", "visual code"] },
            { texto: "NetBeans", puntos: 15, alias: ["net beans", "netbins"] },
            { texto: "Visual Studio", puntos: 12, alias: [] },
            { texto: "Eclipse", puntos: 9, alias: [] },
            { texto: "Dev-C++ / Code::Blocks", puntos: 9, alias: ["dev c", "dev c++", "devc", "dev cpp", "codeblocks", "code blocks"] },
            { texto: "PyCharm / IntelliJ", puntos: 8, alias: ["pycharm", "intellij", "jetbrains", "android studio"] },
            { texto: "Bloc de notas", puntos: 7, alias: ["notepad", "block de notas", "notepad++"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "dificil",
        pregunta: "Menciona una palabra reservada que existe en casi todos los lenguajes",
        respuestas: [
            { texto: "if", puntos: 25, alias: [] },
            { texto: "for", puntos: 18, alias: [] },
            { texto: "while", puntos: 15, alias: [] },
            { texto: "else", puntos: 13, alias: [] },
            { texto: "return", puntos: 12, alias: [] },
            { texto: "int", puntos: 9, alias: ["integer"] },
            { texto: "class", puntos: 8, alias: ["clase"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Una IA que un programador usa",
        respuestas: [
            { texto: "ChatGPT", puntos: 40, alias: ["chat gpt", "gpt", "openai", "chat"] },
            { texto: "Gemini", puntos: 18, alias: ["google gemini", "bard"] },
            { texto: "Copilot", puntos: 14, alias: ["github copilot", "co pilot", "microsoft copilot"] },
            { texto: "Claude", puntos: 10, alias: ["anthropic", "claude code"] },
            { texto: "DeepSeek", puntos: 8, alias: ["deep seek"] },
            { texto: "Meta AI", puntos: 6, alias: ["meta", "llama", "la de whatsapp"] },
            { texto: "Cursor", puntos: 4, alias: [] }
        ]
    }
];

if (typeof module !== "undefined") module.exports = { PREGUNTAS_BASE };
