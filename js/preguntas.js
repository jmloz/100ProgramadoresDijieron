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
 *   - "respuestas": entre 5 y 8 respuestas.
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
        categoria: "Programación",
        dificultad: "facil",
        pregunta: "Menciona algo que buscas en Google o Stack Overflow",
        respuestas: [
            { texto: "Un mensaje de error", puntos: 32, alias: ["error", "el error", "mensaje de error", "excepcion", "exception", "stack trace", "errores"] },
            { texto: "Cómo centrar un div", puntos: 20, alias: ["centrar un div", "centrar div", "center div", "css", "centrar"] },
            { texto: "Sintaxis de un comando", puntos: 15, alias: ["sintaxis", "comando", "comandos", "como se escribe"] },
            { texto: "Código para copiar y pegar", puntos: 12, alias: ["copiar y pegar", "copy paste", "codigo", "ctrl c ctrl v", "copiar codigo"] },
            { texto: "Cómo salir de Vim", puntos: 9, alias: ["salir de vim", "vim", "exit vim", "q"] },
            { texto: "Tutoriales", puntos: 7, alias: ["tutorial", "curso", "cursos", "video", "videos", "youtube"] },
            { texto: "Expresiones regulares", puntos: 5, alias: ["regex", "regexp", "expresion regular"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Menciona una excusa para no entregar la tarea",
        respuestas: [
            { texto: "Se fue el internet", puntos: 30, alias: ["internet", "no hay internet", "sin internet", "wifi", "no tenia internet", "se cayo el internet"] },
            { texto: "Se fue la luz", puntos: 18, alias: ["luz", "apagon", "no habia luz", "sin luz"] },
            { texto: "Se me borró el archivo", puntos: 15, alias: ["se borro", "se me borro", "perdi el archivo", "archivo", "se corrompio", "se borro el archivo"] },
            { texto: "Se descompuso la computadora", puntos: 13, alias: ["computadora", "compu", "laptop", "pc", "se descompuso la compu", "virus", "se murio la compu"] },
            { texto: "No entendí las instrucciones", puntos: 10, alias: ["no entendi", "instrucciones", "no le entendi"] },
            { texto: "Me enfermé", puntos: 8, alias: ["enfermo", "estaba enfermo", "enfermedad", "me enferme"] },
            { texto: "El perro se la comió", puntos: 6, alias: ["perro", "el perro", "mi perro", "gato", "el gato"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "facil",
        pregunta: "Lo primero que haces cuando tu código no compila",
        respuestas: [
            { texto: "Leer el error", puntos: 28, alias: ["leo el error", "error", "ver el error", "leer el mensaje", "mensaje de error"] },
            { texto: "Buscar en Google", puntos: 22, alias: ["google", "buscar", "googlear", "stack overflow", "so", "internet", "buscarlo"] },
            { texto: "Revisar el punto y coma", puntos: 16, alias: ["punto y coma", "punto coma", "semicolon", "buscar el punto y coma"] },
            { texto: "Preguntarle a la IA", puntos: 14, alias: ["chatgpt", "chat gpt", "gpt", "ia", "ai", "inteligencia artificial", "claude", "copilot"] },
            { texto: "Compilar otra vez sin cambiar nada", puntos: 9, alias: ["compilar otra vez", "volver a compilar", "recompilar", "correrlo otra vez", "darle run otra vez"] },
            { texto: "Llorar", puntos: 6, alias: ["lloro", "llorar", "chillar"] },
            { texto: "Preguntarle a un compañero", puntos: 5, alias: ["compañero", "amigo", "preguntarle a alguien", "preguntar a un compañero"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "media",
        pregunta: "Menciona el lenguaje de programación más odiado",
        respuestas: [
            { texto: "JavaScript", puntos: 25, alias: ["js", "java script"] },
            { texto: "Java", puntos: 20, alias: [] },
            { texto: "C++", puntos: 15, alias: ["cpp", "c plus plus", "c mas mas"] },
            { texto: "PHP", puntos: 14, alias: [] },
            { texto: "Ensamblador", puntos: 11, alias: ["assembly", "asm", "ensamblador"] },
            { texto: "COBOL", puntos: 8, alias: [] },
            { texto: "Python", puntos: 7, alias: ["piton"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "facil",
        pregunta: "Menciona el lenguaje favorito de los estudiantes de sistemas",
        respuestas: [
            { texto: "Python", puntos: 35, alias: ["piton"] },
            { texto: "JavaScript", puntos: 18, alias: ["js", "java script"] },
            { texto: "C#", puntos: 14, alias: ["csharp", "c sharp", "c gato"] },
            { texto: "Java", puntos: 12, alias: [] },
            { texto: "C++", puntos: 10, alias: ["cpp", "c plus plus", "c mas mas"] },
            { texto: "C", puntos: 6, alias: ["lenguaje c"] },
            { texto: "Rust", puntos: 5, alias: [] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que hay en la mochila de un estudiante de sistemas",
        respuestas: [
            { texto: "Laptop", puntos: 30, alias: ["computadora", "compu", "lap", "portatil", "pc", "laptop"] },
            { texto: "Cargador", puntos: 20, alias: ["charger", "cable", "cargador de la laptop"] },
            { texto: "Audífonos", puntos: 15, alias: ["audifonos", "headphones", "audios", "cascos", "auriculares"] },
            { texto: "Memoria USB", puntos: 12, alias: ["usb", "memoria", "pendrive"] },
            { texto: "Bebida energética / café", puntos: 10, alias: ["energetica", "bebida energetica", "monster", "red bull", "cafe", "termo"] },
            { texto: "Cuaderno sin usar", puntos: 8, alias: ["cuaderno", "libreta"] },
            { texto: "Mouse", puntos: 5, alias: ["raton"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "media",
        pregunta: "Menciona una razón para desvelarse programando",
        respuestas: [
            { texto: "La entrega es mañana", puntos: 35, alias: ["entrega", "deadline", "entrega mañana", "fecha limite", "tarea", "proyecto"] },
            { texto: "Un bug que no se va", puntos: 22, alias: ["bug", "un bug", "error", "no funciona", "bugs"] },
            { texto: "Procrastinación", puntos: 15, alias: ["procrastinar", "procrastine", "flojera", "lo deje al final"] },
            { texto: "Inspiración", puntos: 10, alias: ["inspirado", "motivacion", "estaba inspirado"] },
            { texto: "Hackathon", puntos: 8, alias: ["hackaton", "concurso", "competencia"] },
            { texto: "Proyecto personal", puntos: 6, alias: ["side project", "proyecto propio"] },
            { texto: "Insomnio", puntos: 4, alias: ["no tenia sueño", "no podia dormir"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "media",
        pregunta: "¿Qué haces cuando el profe dice \"es un proyecto fácil\"?",
        respuestas: [
            { texto: "Entrar en pánico", puntos: 30, alias: ["panico", "miedo", "asustarme", "temblar", "preocuparme"] },
            { texto: "Dejarlo para el último día", puntos: 22, alias: ["dejarlo al final", "ultimo dia", "procrastinar", "dejarlo para el final", "empezar un dia antes"] },
            { texto: "Buscarlo en GitHub", puntos: 16, alias: ["github", "git hub", "copiar de github", "buscar en github"] },
            { texto: "Juntarme con el más listo", puntos: 13, alias: ["el mas listo", "equipo", "buscar equipo", "juntarme con el listo", "buscar al inteligente"] },
            { texto: "Reírme nerviosamente", puntos: 10, alias: ["reir", "reirme", "risa", "nervios", "reirse"] },
            { texto: "No creerle", puntos: 9, alias: ["no le creo", "desconfiar", "dudar", "no creerle nada"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "media",
        pregunta: "Algo que dice un programador cuando su código funciona y no sabe por qué",
        respuestas: [
            { texto: "No lo toques", puntos: 34, alias: ["no tocar", "no le muevas", "no le muevan", "no tocar nada", "no lo toquen"] },
            { texto: "Funciona en mi máquina", puntos: 20, alias: ["en mi maquina funciona", "works on my machine", "en mi compu funciona"] },
            { texto: "Es magia", puntos: 16, alias: ["magia", "brujeria"] },
            { texto: "Commit y push rápido", puntos: 12, alias: ["commit", "push", "git push", "hacer commit", "subirlo"] },
            { texto: "Gracias a Dios", puntos: 10, alias: ["gracias dios", "milagro", "dios", "es un milagro"] },
            { texto: "Ni modo, se entrega", puntos: 8, alias: ["se entrega", "entregarlo", "ni modo", "asi se entrega"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Algo que nunca falta en el escritorio de un programador",
        respuestas: [
            { texto: "Café", puntos: 32, alias: ["cafe", "taza de cafe", "taza", "coffee"] },
            { texto: "Segundo monitor", puntos: 20, alias: ["monitor", "pantalla", "dos monitores", "otra pantalla"] },
            { texto: "Patito de hule", puntos: 14, alias: ["patito", "pato", "rubber duck", "pato de hule"] },
            { texto: "Snacks", puntos: 12, alias: ["botana", "papitas", "comida", "galletas", "dulces"] },
            { texto: "Teclado mecánico", puntos: 10, alias: ["teclado", "keyboard"] },
            { texto: "Post-its", puntos: 7, alias: ["post it", "postit", "notas", "notitas"] },
            { texto: "Latas vacías", puntos: 5, alias: ["latas", "energeticas", "basura"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "media",
        pregunta: "Algo que el profe siempre dice en clase de programación",
        respuestas: [
            { texto: "Esto viene en el examen", puntos: 28, alias: ["examen", "viene en el examen"] },
            { texto: "¿Alguna duda?", puntos: 20, alias: ["dudas", "alguna duda", "preguntas", "hay dudas", "alguna pregunta"] },
            { texto: "Es muy fácil", puntos: 17, alias: ["es facil", "facil", "es sencillo", "esta facil"] },
            { texto: "Investíguenlo", puntos: 14, alias: ["investiguen", "de tarea", "tarea", "investiguen en casa"] },
            { texto: "Lo vemos la próxima clase", puntos: 11, alias: ["proxima clase", "la siguiente clase", "luego lo vemos", "despues lo vemos"] },
            { texto: "No copien", puntos: 10, alias: ["sin copiar", "copia", "plagio", "nada de copiar"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "dificil",
        pregunta: "Nombre de variable que usa un estudiante cuando ya no tiene ideas",
        respuestas: [
            { texto: "x", puntos: 26, alias: [] },
            { texto: "temp", puntos: 20, alias: ["tmp", "temporal"] },
            { texto: "aux", puntos: 18, alias: ["auxiliar"] },
            { texto: "i / j", puntos: 12, alias: ["i", "j", "k"] },
            { texto: "dato", puntos: 10, alias: ["data", "datos"] },
            { texto: "asdf", puntos: 8, alias: ["asd", "asdasd", "qwerty"] },
            { texto: "variable", puntos: 6, alias: ["var", "var1"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "media",
        pregunta: "Menciona algo que hace un programador cuando no le compila el código",
        respuestas: [
            { texto: "Revisar línea por línea", puntos: 25, alias: ["revisar", "revisar el codigo", "linea por linea", "depurar", "debug", "debuggear"] },
            { texto: "Poner prints por todos lados", puntos: 20, alias: ["print", "prints", "console log", "imprimir", "cout", "printf"] },
            { texto: "Reiniciar la computadora", puntos: 16, alias: ["reiniciar", "reiniciar la compu", "apagar y prender", "reboot"] },
            { texto: "Borrar todo y empezar de nuevo", puntos: 14, alias: ["borrar todo", "empezar de nuevo", "reescribir", "desde cero"] },
            { texto: "Culpar al compilador", puntos: 11, alias: ["el compilador", "culpa al compilador", "culpar a la compu", "echarle la culpa"] },
            { texto: "Gritar", puntos: 8, alias: ["groserias", "enojarse", "maldecir", "decir groserias", "enojarme"] },
            { texto: "Ir por café", puntos: 6, alias: ["cafe", "tomar cafe", "descanso", "descansar"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "dificil",
        pregunta: "Algo que da miedo escuchar en un equipo de proyecto",
        respuestas: [
            { texto: "Yo hago la portada", puntos: 30, alias: ["la portada", "portada"] },
            { texto: "No he empezado", puntos: 22, alias: ["no he hecho nada", "no hice nada", "no lo empece", "no empece"] },
            { texto: "Se me olvidó hacer commit", puntos: 15, alias: ["commit", "olvide hacer commit", "no subi nada", "no hice push"] },
            { texto: "Hice force push", puntos: 12, alias: ["force push", "push force", "git push force", "force"] },
            { texto: "Lo hice en otro lenguaje", puntos: 11, alias: ["otro lenguaje", "en otro lenguaje"] },
            { texto: "Mañana lo hago", puntos: 10, alias: ["mañana", "luego lo hago", "al rato", "al rato lo hago"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que un estudiante de sistemas escucha de su familia",
        respuestas: [
            { texto: "Arréglame la computadora", puntos: 38, alias: ["arreglame la compu", "arregla la computadora", "compu", "computadora", "arreglar la compu"] },
            { texto: "Arregla la impresora", puntos: 20, alias: ["impresora", "la impresora"] },
            { texto: "Ponme el wifi", puntos: 14, alias: ["wifi", "internet", "el internet", "contraseña del wifi"] },
            { texto: "¿Hackeas Facebook?", puntos: 12, alias: ["hackear", "hackear facebook", "hackeas", "facebook", "hacker"] },
            { texto: "Te la pasas en la compu", puntos: 10, alias: ["siempre en la compu", "solo juegas", "te la pasas jugando"] },
            { texto: "¿Y eso para qué sirve?", puntos: 6, alias: ["para que sirve", "eso para que sirve", "que haces"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Menciona un editor o IDE que usan los programadores",
        respuestas: [
            { texto: "VS Code", puntos: 40, alias: ["vscode", "visual studio code", "code"] },
            { texto: "Visual Studio", puntos: 15, alias: [] },
            { texto: "IntelliJ / JetBrains", puntos: 12, alias: ["intellij", "jetbrains", "pycharm", "android studio"] },
            { texto: "Vim", puntos: 10, alias: ["neovim", "nvim", "vi"] },
            { texto: "Notepad++", puntos: 8, alias: ["notepad plus plus"] },
            { texto: "Eclipse", puntos: 8, alias: [] },
            { texto: "Bloc de notas", puntos: 7, alias: ["notepad", "block de notas"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "facil",
        pregunta: "Menciona un lenguaje que se aprende en la carrera",
        respuestas: [
            { texto: "C", puntos: 25, alias: ["lenguaje c"] },
            { texto: "Java", puntos: 22, alias: [] },
            { texto: "Python", puntos: 20, alias: ["piton"] },
            { texto: "C++", puntos: 13, alias: ["cpp", "c plus plus", "c mas mas"] },
            { texto: "SQL", puntos: 10, alias: ["mysql", "base de datos"] },
            { texto: "JavaScript", puntos: 6, alias: ["js", "java script"] },
            { texto: "Ensamblador", puntos: 4, alias: ["assembly", "asm"] }
        ]
    },
    {
        categoria: "Programación",
        dificultad: "dificil",
        pregunta: "Menciona un error que todo programador ha visto",
        respuestas: [
            { texto: "NullPointerException", puntos: 28, alias: ["null pointer", "null", "referencia nula", "null reference", "nullreferenceexception"] },
            { texto: "Segmentation fault", puntos: 20, alias: ["segfault", "violacion de segmento", "core dumped"] },
            { texto: "Syntax error", puntos: 18, alias: ["error de sintaxis", "sintaxis"] },
            { texto: "Stack overflow", puntos: 12, alias: ["desbordamiento de pila", "stackoverflow", "recursion infinita"] },
            { texto: "Index out of bounds", puntos: 12, alias: ["fuera de rango", "index out of range", "out of bounds", "indice fuera de rango"] },
            { texto: "404 Not Found", puntos: 10, alias: ["404", "not found", "no encontrado"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "media",
        pregunta: "Algo que hace un programador en su día libre",
        respuestas: [
            { texto: "Programar", puntos: 30, alias: ["mas codigo", "proyecto personal", "codear"] },
            { texto: "Videojuegos", puntos: 25, alias: ["jugar", "juegos", "gaming", "videojuego"] },
            { texto: "Dormir", puntos: 20, alias: ["descansar", "siesta"] },
            { texto: "Ver series", puntos: 12, alias: ["series", "netflix", "anime", "peliculas"] },
            { texto: "Salir con amigos", puntos: 8, alias: ["amigos", "salir", "fiesta"] },
            { texto: "Tocar pasto", puntos: 5, alias: ["touch grass", "salir afuera", "ir al parque"] }
        ]
    },
    {
        categoria: "Lenguajes",
        dificultad: "dificil",
        pregunta: "Menciona una palabra reservada que existe en casi todos los lenguajes",
        respuestas: [
            { texto: "if", puntos: 25, alias: [] },
            { texto: "for", puntos: 20, alias: [] },
            { texto: "while", puntos: 15, alias: [] },
            { texto: "return", puntos: 14, alias: [] },
            { texto: "else", puntos: 12, alias: [] },
            { texto: "class", puntos: 8, alias: ["clase"] },
            { texto: "int", puntos: 6, alias: ["integer"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Una página que todo programador tiene en favoritos",
        respuestas: [
            { texto: "Stack Overflow", puntos: 30, alias: ["so", "stackoverflow"] },
            { texto: "GitHub", puntos: 25, alias: ["git hub"] },
            { texto: "YouTube", puntos: 15, alias: ["you tube"] },
            { texto: "ChatGPT / IA", puntos: 13, alias: ["chatgpt", "chat gpt", "gpt", "ia", "claude", "gemini"] },
            { texto: "Documentación oficial", puntos: 10, alias: ["documentacion", "docs", "mdn", "la documentacion"] },
            { texto: "W3Schools", puntos: 7, alias: ["w3", "w3 schools"] }
        ]
    }
];

if (typeof module !== "undefined") module.exports = { PREGUNTAS_BASE };
