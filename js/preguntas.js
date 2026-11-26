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
    },
    {
        categoria: "Técnicas",
        dificultad: "facil",
        pregunta: "Menciona un lenguaje de programación",
        respuestas: [
            { texto: "Python", puntos: 28, alias: ["phyton", "piton", "py"] },
            { texto: "JavaScript", puntos: 22, alias: ["java script", "js", "javascrip", "node", "nodejs"] },
            { texto: "Java", puntos: 15, alias: ["jaba"] },
            { texto: "C++", puntos: 12, alias: ["c mas mas", "cpp", "c plus plus", "ce mas mas"] },
            { texto: "C#", puntos: 8, alias: ["c sharp", "csharp", "c gato", "ce sharp"] },
            { texto: "PHP", puntos: 6, alias: ["pe hache pe"] },
            { texto: "C", puntos: 5, alias: ["lenguaje c", "ce"] },
            { texto: "TypeScript", puntos: 4, alias: ["type script", "ts"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "facil",
        pregunta: "Un editor o IDE para programar",
        respuestas: [
            { texto: "VS Code", puntos: 40, alias: ["visual studio code", "vscode", "code", "visual code"] },
            { texto: "Visual Studio", puntos: 15, alias: ["visual", "vs"] },
            { texto: "JetBrains (IntelliJ, PyCharm...)", puntos: 12, alias: ["jetbrains", "intellij", "pycharm", "webstorm", "android studio", "rider", "phpstorm", "clion"] },
            { texto: "Cursor", puntos: 10, alias: ["cursor ai", "windsurf"] },
            { texto: "NetBeans", puntos: 8, alias: ["net beans", "netbeans ide"] },
            { texto: "Eclipse", puntos: 6, alias: ["eclipse ide"] },
            { texto: "Bloc de notas", puntos: 5, alias: ["notepad", "notepad++", "notepad plus plus", "block de notas", "sublime", "sublime text"] },
            { texto: "Vim / Neovim", puntos: 4, alias: ["vim", "neovim", "nvim", "vi", "emacs", "nano"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "media",
        pregunta: "Un framework o librería para hacer páginas web",
        respuestas: [
            { texto: "React", puntos: 34, alias: ["reactjs", "react js", "react native"] },
            { texto: "Angular", puntos: 16, alias: ["angularjs", "angular js"] },
            { texto: "Vue", puntos: 12, alias: ["vuejs", "vue js", "nuxt"] },
            { texto: "Laravel", puntos: 10, alias: ["lara", "php laravel"] },
            { texto: "Next.js", puntos: 10, alias: ["next", "nextjs", "next js"] },
            { texto: "Django", puntos: 8, alias: ["flask", "fastapi"] },
            { texto: "Bootstrap", puntos: 6, alias: ["tailwind", "tailwind css", "bootstrap css"] },
            { texto: "Svelte", puntos: 4, alias: ["sveltekit", "astro"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "media",
        pregunta: "Un comando de Git",
        respuestas: [
            { texto: "git commit", puntos: 28, alias: ["commit", "comit", "hacer commit"] },
            { texto: "git push", puntos: 24, alias: ["push", "pushear", "subir"] },
            { texto: "git pull", puntos: 16, alias: ["pull", "jalar", "bajar cambios"] },
            { texto: "git add", puntos: 12, alias: ["add", "git add ."] },
            { texto: "git clone", puntos: 8, alias: ["clone", "clonar"] },
            { texto: "git merge", puntos: 6, alias: ["merge", "mergear", "rebase", "git rebase"] },
            { texto: "git status", puntos: 4, alias: ["status", "git log", "log"] },
            { texto: "git checkout", puntos: 2, alias: ["checkout", "git branch", "branch", "git switch", "switch"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "media",
        pregunta: "Un error que todo programador ha visto",
        respuestas: [
            { texto: "NullPointerException", puntos: 26, alias: ["null pointer", "null", "nulo", "null reference", "nullreferenceexception", "nonetype"] },
            { texto: "Error 404", puntos: 22, alias: ["404", "not found", "pagina no encontrada"] },
            { texto: "Syntax error", puntos: 18, alias: ["error de sintaxis", "sintaxis", "falta punto y coma", "punto y coma", "syntaxerror"] },
            { texto: "Segmentation fault", puntos: 10, alias: ["segfault", "segmentation", "core dumped", "violacion de segmento"] },
            { texto: "Stack overflow", puntos: 8, alias: ["stackoverflow", "desbordamiento de pila", "recursion infinita", "bucle infinito", "ciclo infinito"] },
            { texto: "undefined", puntos: 8, alias: ["undefined is not a function", "is not defined", "cannot read properties of undefined", "nan"] },
            { texto: "Error de CORS", puntos: 5, alias: ["cors", "blocked by cors policy"] },
            { texto: "Error 500", puntos: 3, alias: ["500", "internal server error", "error del servidor"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "dificil",
        pregunta: "Un lugar o servicio para subir (desplegar) tu proyecto",
        respuestas: [
            { texto: "AWS", puntos: 28, alias: ["amazon web services", "amazon", "ec2", "s3", "lambda"] },
            { texto: "Vercel", puntos: 18, alias: ["versel"] },
            { texto: "Azure", puntos: 14, alias: ["microsoft azure"] },
            { texto: "Google Cloud", puntos: 12, alias: ["gcp", "firebase hosting", "firebase"] },
            { texto: "GitHub Pages", puntos: 10, alias: ["github", "pages", "git hub pages"] },
            { texto: "Netlify", puntos: 8, alias: ["netlifi"] },
            { texto: "Heroku", puntos: 6, alias: ["render", "railway"] },
            { texto: "Hostinger", puntos: 4, alias: ["hosting", "godaddy", "un hosting", "cpanel"] }
        ]
    },
    {
        categoria: "Técnicas",
        dificultad: "dificil",
        pregunta: "Una distribución de Linux",
        respuestas: [
            { texto: "Ubuntu", puntos: 38, alias: ["ubuntu linux", "kubuntu", "xubuntu"] },
            { texto: "Arch Linux", puntos: 15, alias: ["arch", "omarchy", "endeavour", "endeavouros", "cachyos"] },
            { texto: "Debian", puntos: 12, alias: ["debian linux"] },
            { texto: "Fedora", puntos: 10, alias: ["fedora linux"] },
            { texto: "Kali Linux", puntos: 9, alias: ["kali", "parrot"] },
            { texto: "Linux Mint", puntos: 8, alias: ["mint"] },
            { texto: "Red Hat", puntos: 4, alias: ["redhat", "rhel", "centos", "rocky", "rocky linux"] },
            { texto: "Manjaro", puntos: 4, alias: ["pop os", "popos", "pop!_os", "zorin", "zorin os"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "media",
        pregunta: "Una excusa cuando tu código no funciona",
        respuestas: [
            { texto: "En mi máquina sí funciona", puntos: 34, alias: ["en mi maquina funciona", "en mi compu funciona", "en mi compu si jala", "works on my machine", "en mi maquina"] },
            { texto: "Ayer sí funcionaba", puntos: 18, alias: ["ayer jalaba", "ayer si jalaba", "hace rato funcionaba", "antes funcionaba"] },
            { texto: "Es culpa del internet / servidor", puntos: 12, alias: ["internet", "el servidor", "el wifi", "se cayo el servidor", "es la red"] },
            { texto: "No es bug, es feature", puntos: 10, alias: ["es un feature", "es una funcionalidad", "feature", "no es un error"] },
            { texto: "Fue la IA", puntos: 10, alias: ["la ia", "chatgpt", "lo hizo la ia", "copilot", "claude", "culpa de la ia"] },
            { texto: "No le moví nada", puntos: 9, alias: ["no le movi", "yo no fui", "no toque nada", "no le hice nada"] },
            { texto: "Es la caché", puntos: 7, alias: ["cache", "borra la cache", "el cache", "limpia la cache", "ctrl f5"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Una página que un programador visita a diario",
        respuestas: [
            { texto: "GitHub", puntos: 30, alias: ["git hub", "gitlab", "repositorio"] },
            { texto: "Stack Overflow", puntos: 18, alias: ["stackoverflow", "stack"] },
            { texto: "YouTube", puntos: 16, alias: ["youtube", "tutoriales", "yt"] },
            { texto: "Reddit", puntos: 10, alias: ["r/programming", "r/programminghumor"] },
            { texto: "LinkedIn", puntos: 10, alias: ["linked in", "linkedin", "bolsa de trabajo"] },
            { texto: "X / Twitter", puntos: 8, alias: ["twitter", "x", "bluesky"] },
            { texto: "Discord", puntos: 5, alias: ["discord server"] },
            { texto: "Documentación oficial", puntos: 3, alias: ["documentacion", "docs", "mdn", "w3schools"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Algo que un programador le pregunta a Google o a la IA",
        respuestas: [
            { texto: "Cómo arreglar un error", puntos: 30, alias: ["el error", "un error", "arreglar error", "pegar el error", "bug", "por que no funciona"] },
            { texto: "Cómo centrar un div", puntos: 20, alias: ["centrar div", "centrar", "centrar un div", "css"] },
            { texto: "Cómo salir de Vim", puntos: 14, alias: ["salir de vim", "vim", "como salir de vim"] },
            { texto: "Cómo usar Git", puntos: 12, alias: ["git", "comandos de git", "deshacer commit", "como deshacer un commit"] },
            { texto: "Una expresión regular", puntos: 10, alias: ["regex", "expresion regular", "regexp"] },
            { texto: "Un tutorial", puntos: 8, alias: ["tutorial", "curso", "como hacer un login", "como hacer un crud", "crud"] },
            { texto: "Vacantes de trabajo", puntos: 6, alias: ["trabajo", "empleo", "vacantes", "sueldo de programador", "cuanto gana un programador"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "media",
        pregunta: "Algo que te da miedo hacer en producción (sobre todo en viernes)",
        respuestas: [
            { texto: "Hacer deploy", puntos: 36, alias: ["deploy", "desplegar", "subir a produccion", "subir cambios", "publicar"] },
            { texto: "Borrar la base de datos", puntos: 22, alias: ["drop table", "drop database", "delete sin where", "borrar datos", "base de datos", "borrar la bd"] },
            { texto: "git push --force", puntos: 14, alias: ["push force", "force push", "git push force", "forzar push"] },
            { texto: "Actualizar dependencias", puntos: 10, alias: ["actualizar", "npm update", "dependencias", "actualizar librerias", "npm install"] },
            { texto: "Reiniciar el servidor", puntos: 8, alias: ["reiniciar", "apagar el servidor", "servidor", "reboot"] },
            { texto: "Correr una migración", puntos: 6, alias: ["migracion", "migraciones", "migrate"] },
            { texto: "Tocar la configuración", puntos: 4, alias: ["configuracion", "config", "variables de entorno", ".env", "dns"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Algo que haces cuando no encuentras el bug",
        respuestas: [
            { texto: "Poner prints / console.log", puntos: 30, alias: ["print", "prints", "console log", "consolelog", "imprimir", "debuggear", "debugger", "breakpoint"] },
            { texto: "Preguntarle a la IA", puntos: 22, alias: ["ia", "chatgpt", "gpt", "claude", "copilot", "gemini", "preguntarle a chatgpt"] },
            { texto: "Buscar en Google / Stack Overflow", puntos: 14, alias: ["google", "googlear", "stack overflow", "buscar", "buscar en internet"] },
            { texto: "Explicárselo al patito", puntos: 10, alias: ["patito", "patito de hule", "rubber duck", "pato", "explicarselo a alguien"] },
            { texto: "Reiniciar", puntos: 9, alias: ["reiniciar la compu", "apagar y prender", "reiniciar el servidor", "volver a correrlo"] },
            { texto: "Ir por café / dormir", puntos: 8, alias: ["cafe", "dormir", "descansar", "salir a caminar", "tomar aire"] },
            { texto: "Borrar todo y empezar de nuevo", puntos: 7, alias: ["borrar todo", "empezar de nuevo", "rehacerlo", "llorar", "rendirse"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "facil",
        pregunta: "Una marca de laptop que usa un programador",
        respuestas: [
            { texto: "MacBook / Apple", puntos: 32, alias: ["mac", "macbook", "apple", "macbook pro", "macbook air"] },
            { texto: "Lenovo", puntos: 20, alias: ["thinkpad", "legion", "ideapad"] },
            { texto: "HP", puntos: 14, alias: ["hewlett packard", "pavilion", "omen", "victus"] },
            { texto: "Dell", puntos: 12, alias: ["alienware", "xps", "inspiron"] },
            { texto: "Asus", puntos: 10, alias: ["rog", "tuf", "zenbook", "vivobook"] },
            { texto: "Acer", puntos: 7, alias: ["nitro", "predator", "aspire"] },
            { texto: "MSI", puntos: 5, alias: ["huawei", "samsung", "framework", "toshiba"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "media",
        pregunta: "Algo que te piden en una vacante para programador junior",
        respuestas: [
            { texto: "Años de experiencia", puntos: 32, alias: ["experiencia", "5 años de experiencia", "3 años de experiencia", "años"] },
            { texto: "Inglés", puntos: 22, alias: ["ingles", "ingles avanzado", "ingles fluido", "idioma"] },
            { texto: "Título", puntos: 14, alias: ["titulo", "cedula", "titulado", "carrera terminada", "licenciatura"] },
            { texto: "Saber de todo", puntos: 12, alias: ["muchos lenguajes", "full stack", "saber muchas tecnologias", "tecnologias", "saber todo"] },
            { texto: "Saber Git", puntos: 8, alias: ["git", "github"] },
            { texto: "Portafolio", puntos: 7, alias: ["proyectos", "portafolio de proyectos", "cv", "curriculum"] },
            { texto: "Trabajo en equipo", puntos: 5, alias: ["habilidades blandas", "soft skills", "comunicacion", "proactivo", "trabajo bajo presion"] }
        ]
    },
    {
        categoria: "Cultura dev",
        dificultad: "media",
        pregunta: "Una empresa de tecnología donde te gustaría trabajar",
        respuestas: [
            { texto: "Google", puntos: 34, alias: ["alphabet", "gugul"] },
            { texto: "Microsoft", puntos: 18, alias: ["micro soft", "msft"] },
            { texto: "Apple", puntos: 14, alias: ["la de la manzana"] },
            { texto: "Meta", puntos: 8, alias: ["facebook", "instagram", "whatsapp"] },
            { texto: "Amazon", puntos: 8, alias: ["aws", "amazon web services"] },
            { texto: "OpenAI", puntos: 6, alias: ["open ai", "chatgpt", "anthropic"] },
            { texto: "Nvidia", puntos: 6, alias: ["nvidea", "envidia"] },
            { texto: "Mercado Libre", puntos: 6, alias: ["mercadolibre", "meli", "mercado pago"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "facil",
        pregunta: "Algo que haces la noche antes de entregar el proyecto",
        respuestas: [
            { texto: "No dormir", puntos: 30, alias: ["desvelarse", "desvelo", "desvelarme", "no dormir nada", "trasnochar", "amanecerse"] },
            { texto: "Tomar café / energéticas", puntos: 22, alias: ["cafe", "energeticas", "monster", "red bull", "bebidas energeticas", "vive 100"] },
            { texto: "Pedírselo a la IA", puntos: 16, alias: ["ia", "chatgpt", "gpt", "claude", "usar la ia", "copilot"] },
            { texto: "Rezar", puntos: 10, alias: ["orar", "encomendarse", "pedirle a dios"] },
            { texto: "Llorar", puntos: 8, alias: ["estresarse", "estres", "panico", "ansiedad"] },
            { texto: "Copiar de GitHub", puntos: 8, alias: ["copiar", "github", "copiar codigo", "copiar de internet", "pedirselo a un compa"] },
            { texto: "Pedir prórroga", puntos: 6, alias: ["prorroga", "pedir mas tiempo", "rogarle al profe", "inventar excusa", "excusa"] }
        ]
    },
    {
        categoria: "Vida estudiantil",
        dificultad: "media",
        pregunta: "Una materia que muchos reprueban en sistemas",
        respuestas: [
            { texto: "Cálculo", puntos: 34, alias: ["calculo", "calculo diferencial", "calculo integral", "calculo vectorial"] },
            { texto: "Física", puntos: 18, alias: ["fisica", "fisica general", "electricidad y magnetismo"] },
            { texto: "Matemáticas discretas", puntos: 12, alias: ["discretas", "matematicas", "mate discretas"] },
            { texto: "Álgebra lineal", puntos: 12, alias: ["algebra", "algebra lineal"] },
            { texto: "Estructura de datos", puntos: 10, alias: ["estructuras de datos", "estructura", "algoritmos"] },
            { texto: "Ecuaciones diferenciales", puntos: 8, alias: ["ecuaciones", "ecuaciones diferenciales"] },
            { texto: "Programación", puntos: 6, alias: ["programacion", "fundamentos de programacion", "poo", "programacion orientada a objetos"] }
        ]
    },
    {
        categoria: "Congreso",
        dificultad: "facil",
        pregunta: "Algo que te llevas de un congreso",
        respuestas: [
            { texto: "Stickers", puntos: 28, alias: ["calcomanias", "estampas", "pegatinas"] },
            { texto: "Playera", puntos: 20, alias: ["camisa", "playeras", "merch", "sudadera"] },
            { texto: "Constancia", puntos: 18, alias: ["diploma", "certificado", "reconocimiento", "constancia de asistencia"] },
            { texto: "Contactos", puntos: 12, alias: ["amigos", "networking", "linkedin", "conocidos"] },
            { texto: "Conocimiento", puntos: 10, alias: ["aprendizaje", "aprender", "nuevas ideas", "experiencia"] },
            { texto: "Fotos", puntos: 7, alias: ["selfies", "foto", "recuerdos"] },
            { texto: "Termo / botella", puntos: 5, alias: ["termo", "botella", "taza", "pluma", "plumas", "gafete", "libreta"] }
        ]
    }
];

if (typeof module !== "undefined") module.exports = { PREGUNTAS_BASE };
