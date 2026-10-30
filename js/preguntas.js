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
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que haces en clase en vez de poner atención",
        respuestas: [
            { texto: "Ver el celular", puntos: 32, alias: ["celular", "cel", "el cel", "telefono", "redes sociales", "redes", "tiktok", "instagram", "whatsapp", "facebook", "scrollear"] },
            { texto: "Dormir", puntos: 20, alias: ["dormirme", "me duermo", "siesta", "cabecear", "una siesta"] },
            { texto: "Jugar", puntos: 15, alias: ["videojuegos", "juegos", "jugar en la compu", "jugar en el cel", "jugar lol", "jugar minecraft"] },
            { texto: "Comer", puntos: 12, alias: ["comer a escondidas", "botanear", "snacks", "botana", "comida", "comer en clase"] },
            { texto: "Hacer la tarea de otra materia", puntos: 10, alias: ["tarea", "hacer tarea", "otra tarea", "tarea de otra materia", "otra materia"] },
            { texto: "Platicar", puntos: 7, alias: ["platicar con el compa", "hablar", "chismear", "chisme", "echar chisme"] },
            { texto: "Dibujar en el cuaderno", puntos: 4, alias: ["dibujar", "garabatos", "rayar el cuaderno", "hacer dibujitos"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Algo que nunca falta en el escritorio de un programador",
        respuestas: [
            { texto: "Café", puntos: 32, alias: ["cafe", "taza de cafe", "taza", "coffee", "termo"] },
            { texto: "Segundo monitor", puntos: 20, alias: ["monitor", "pantalla", "dos monitores", "otra pantalla", "otro monitor"] },
            { texto: "Snacks", puntos: 15, alias: ["botana", "papitas", "comida", "galletas", "dulces", "sabritas"] },
            { texto: "Audífonos", puntos: 13, alias: ["audifonos", "headphones", "audios", "cascos", "auriculares", "diademas"] },
            { texto: "Teclado mecánico", puntos: 10, alias: ["teclado", "keyboard", "teclado gamer"] },
            { texto: "Patito de hule", puntos: 6, alias: ["patito", "pato", "rubber duck", "pato de hule", "patito de goma"] },
            { texto: "Latas vacías", puntos: 4, alias: ["latas", "energeticas", "monster", "red bull", "basura", "bebidas energeticas"] }
        ]
    },
    {
        categoria: "Congreso",
        dificultad: "facil",
        pregunta: "Algo que hay en un congreso de tecnología",
        respuestas: [
            { texto: "Conferencias", puntos: 32, alias: ["conferencia", "ponencias", "ponentes", "charlas", "platicas", "conferencistas", "keynote"] },
            { texto: "Talleres", puntos: 24, alias: ["taller", "workshops", "workshop", "cursos"] },
            { texto: "Café", puntos: 16, alias: ["cafe", "coffee break", "cafecito", "comida", "bocadillos"] },
            { texto: "Regalos / merch", puntos: 14, alias: ["regalos", "merch", "playeras", "playera", "stickers", "calcomanias", "plumas", "souvenirs", "cosas gratis"] },
            { texto: "Concursos", puntos: 8, alias: ["concurso", "rifas", "rifa", "hackathon", "hackaton", "premios", "juegos"] },
            { texto: "Networking", puntos: 6, alias: ["contactos", "conocer gente", "hacer contactos", "amigos"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Una manera de pasar un examen",
        respuestas: [
            { texto: "Estudiar", puntos: 30, alias: ["estudiando", "estudiar mucho", "repasar", "leer", "hacer la guia", "guia", "practicar"] },
            { texto: "Copiar", puntos: 22, alias: ["copiando", "acordeon", "hacer acordeon", "chivo", "copiarle al de al lado", "copiarle al compa", "pasarse las respuestas"] },
            { texto: "Usar la IA", puntos: 18, alias: ["ia", "ai", "chatgpt", "chat gpt", "gpt", "inteligencia artificial", "preguntarle a la ia", "gemini", "claude", "copilot"] },
            { texto: "Rezar", puntos: 12, alias: ["orar", "encomendarse a dios", "dios", "persignarse", "fe", "pedirle a dios", "milagro"] },
            { texto: "Adivinar", puntos: 9, alias: ["suerte", "a la suerte", "tin marin", "de tin marin", "echarle suerte", "contestar al azar", "azar"] },
            { texto: "Rogarle al profe", puntos: 6, alias: ["rogar", "suplicar", "llorarle al profe", "pedirle al profe", "convencer al profe", "negociar"] },
            { texto: "Hacer puntos extra", puntos: 3, alias: ["puntos extra", "trabajo extra", "extra"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "media",
        pregunta: "Un trabajo que tus papás creen que haces por estudiar sistemas",
        respuestas: [
            { texto: "Arreglar computadoras", puntos: 34, alias: ["arreglar compus", "arreglar la compu", "tecnico", "tecnico de computadoras", "reparar computadoras", "computadoras", "compus"] },
            { texto: "Hacker", puntos: 22, alias: ["hackear", "hackeo", "hackear cuentas", "hackear facebook", "jaker"] },
            { texto: "Hacer páginas web", puntos: 16, alias: ["paginas", "paginas web", "hacer paginas", "diseñar paginas", "sitios web", "web"] },
            { texto: "Arreglar celulares", puntos: 12, alias: ["celulares", "arreglar el cel", "reparar celulares", "tecnico de celulares", "cel"] },
            { texto: "Hacer videojuegos", puntos: 10, alias: ["videojuegos", "juegos", "crear juegos", "hacer juegos"] },
            { texto: "Poner el internet", puntos: 6, alias: ["internet", "wifi", "instalar internet", "poner el wifi", "el del internet", "telmex", "redes"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "media",
        pregunta: "Menciona un gestor de bases de datos",
        respuestas: [
            { texto: "MySQL", puntos: 32, alias: ["my sql", "mysql workbench", "workbench", "mariadb", "xampp", "phpmyadmin"] },
            { texto: "SQL Server", puntos: 20, alias: ["sqlserver", "microsoft sql server", "ms sql", "mssql", "sql server management studio", "ssms"] },
            { texto: "PostgreSQL", puntos: 16, alias: ["postgres", "postgre", "postgre sql", "pgadmin", "supabase"] },
            { texto: "Oracle", puntos: 12, alias: ["oracle database", "oracle db", "base de datos oracle"] },
            { texto: "MongoDB", puntos: 10, alias: ["mongo", "mongo db"] },
            { texto: "SQLite", puntos: 6, alias: ["sql lite", "sqlite3"] },
            { texto: "Firebase", puntos: 4, alias: ["fire base", "firestore"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "facil",
        pregunta: "Menciona una parte de la computadora",
        respuestas: [
            { texto: "Procesador", puntos: 30, alias: ["cpu", "micro", "microprocesador", "intel", "amd", "ryzen", "procesador central"] },
            { texto: "Memoria RAM", puntos: 22, alias: ["ram", "memoria", "memorias ram"] },
            { texto: "Tarjeta madre", puntos: 16, alias: ["motherboard", "placa madre", "placa base", "mother", "board", "tarjeta principal"] },
            { texto: "Disco duro / SSD", puntos: 14, alias: ["disco duro", "disco", "ssd", "hdd", "almacenamiento", "unidad de estado solido", "nvme", "m2"] },
            { texto: "Tarjeta de video", puntos: 10, alias: ["tarjeta grafica", "gpu", "grafica", "nvidia", "rtx", "video"] },
            { texto: "Fuente de poder", puntos: 5, alias: ["fuente", "fuente de alimentacion", "psu", "power supply"] },
            { texto: "Ventilador", puntos: 3, alias: ["ventiladores", "fan", "disipador", "abanico", "enfriamiento"] }
        ]
    }
];

if (typeof module !== "undefined") module.exports = { PREGUNTAS_BASE };
