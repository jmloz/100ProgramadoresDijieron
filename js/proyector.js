/*
 * ============================================================
 *  PROYECTOR (proyector.html)
 *  Pantalla para el público. No tiene lógica de juego: solo
 *  dibuja el estado que le manda el panel del moderador.
 * ============================================================
 */

/** Lo que dice el robot en la portada mientras entra el público (rotan cada pocos segundos). */
const FRASES_ROBOT = [
    "¡Hola! Soy el robot de PROXY.",
    "¿Listos para jugar?",
    "Encuestamos a 100 programadores…",
    "…y nadie leyó la documentación.",
    "En mi máquina sí funciona.",
    "Hay 10 tipos de personas: las que saben binario y las que no.",
    "git commit -m \"ya quedó\"",
    "¿Ya intentaron apagarlo y prenderlo?",
    "No es un bug: es una característica sorpresa.",
    "¡Prepárense, equipos!",
    "Crea, conecta y conquista."
];

/**
 * Línea de tiempo de la animación entre rondas, en milisegundos.
 * Sonidos.transicion() (panel) suena al mismo ritmo: si cambias estos tiempos, ajústalos allá también.
 */
const TRANSICION = {
    larga: { lineas: [300, 1200, 2100, 3000], ok: 600, barra: 3900, barraDura: 1400, exito: 5400, ronda: 6000, fin: 10200 },
    corta: { ronda: 0, fin: 3800 }
};

const Proyector = {
    idRonda: null,
    animadas: new Set(),        // casillas que ya hicieron su animación de volteo
    ultimaPantalla: null,
    recibioEstado: false,
    aciertos: 0,                // respuestas dichas en la ronda, para que el robot celebre
    caraRobot: null,
    temporizadorRobot: null,
    pasosTransicion: [],        // setTimeout pendientes de la animación entre rondas
    patrocinadores: true,
    inicio: "",                 // hora de inicio de la actividad ("HH:MM") para la cuenta regresiva
    indiceFrase: 0,

    /** Punto de entrada: llega un estado nuevo desde el panel. */
    recibir(estado, efecto) {
        this.recibioEstado = true;
        this.revisarPanel();
        document.documentElement.dataset.tema = estado.tema === "claro" ? "claro" : "oscuro";
        this.inicio = estado.inicio || "";
        this.actualizarCuenta();
        this.patrocinadores = estado.patrocinadores !== false;
        document.body.classList.toggle("sin-patrocinadores", !this.patrocinadores);
        switch (estado.pantalla) {
            case "juego": this.dibujarJuego(estado); break;
            case "final": this.dibujarFinal(estado); break;
            default: this.mostrar("espera");
        }
        if (efecto && efecto.tipo === "x") {
            this.mostrarXGrande(efecto.cantidad);
            this.reaccionarRobot("error");
        }
        if (efecto && efecto.tipo === "festejo") this.festejar();
    },

    mostrar(pantalla) {
        if (this.ultimaPantalla !== pantalla) mostrarPantalla(pantalla);
        this.ultimaPantalla = pantalla;
    },

    dibujarJuego(e) {
        e.equipos.forEach((eq, i) => {
            const caja = $(`equipo-${i}`);
            caja.querySelector(".equipo-nombre").textContent = eq.nombre;
            animarNumero(caja.querySelector(".equipo-puntos"), eq.puntos, 900);
            caja.classList.toggle("en-turno", e.enTurno === i);
        });
        $("ronda").textContent = e.ronda;
        $("ronda").classList.toggle("final", e.esFinal);
        animarNumero($("banco"), e.banco, 650, true);
        $("pregunta").textContent = e.pregunta;
        this.dibujarTablero(e);

        dibujarErrores($("errores"), e.errores, e.maxErrores || 3);
        this.dibujarReloj(e.tiempo);

        const turno = $("turno");
        turno.replaceChildren(el("div", { clase: "turno-principal", texto: e.turno }));
        if (e.aviso) turno.append(el("div", { clase: "aviso", texto: e.aviso }));

        this.mostrar("juego");
    },

    dibujarTablero(e) {
        const aciertos = e.respuestas.filter(r => r.visible && !r.noDicha).length;
        if (this.idRonda !== e.idRonda) {   // ronda nueva: todas las casillas vuelven a animarse
            // Si el proyector se abrió a media ronda no tiene caso presentarla
            const recienEmpieza = !e.respuestas.some(r => r.visible) && e.errores === 0;
            if ((this.idRonda !== null || recienEmpieza) && e.transicion !== "no") this.mostrarTransicion(e);
            this.idRonda = e.idRonda;
            this.animadas = new Set();
        } else if (aciertos > this.aciertos) {
            this.reaccionarRobot("feliz");
        }
        this.aciertos = aciertos;
        const tablero = $("tablero");
        tablero.replaceChildren(...e.respuestas.map((r, i) => {
            const casilla = el("div", { clase: "casilla" });
            if (!r.visible) {
                casilla.append(el("span", { clase: "numero", texto: String(i + 1) }));
                return casilla;
            }
            casilla.classList.add("revelada");
            if (r.noDicha) casilla.classList.add("no-dicha");
            if (!this.animadas.has(i)) {
                casilla.classList.add("animar");
                casilla.style.setProperty("--n", Math.max(r.texto.length, 1));
                this.animadas.add(i);
            }
            casilla.append(
                el("span", { clase: "texto", texto: r.texto }),
                el("span", { clase: "puntos", texto: String(r.puntos) })
            );
            return casilla;
        }));
    },

    /** Cuenta regresiva: barra ASCII que se vacía; roja en los últimos 5 segundos. */
    dibujarReloj(t) {
        const nodo = $("reloj");
        nodo.hidden = !t;
        if (!t) return;
        nodo.textContent = textoReloj(t, 20);
        nodo.classList.toggle("urgente", t.restante <= 5);
        nodo.classList.toggle("pausado", t.pausado);
    },

    dibujarFinal(e) {
        const yaEstaba = this.ultimaPantalla === "final";
        $("final-ganador").textContent = e.ganador || "¡EMPATE!";
        const puntos = e.equipos.map(eq => el("strong", { texto: yaEstaba ? String(eq.puntos) : "0" }));
        $("final-marcador").replaceChildren(...e.equipos.map((eq, i) =>
            el("div", { clase: "final-fila" + (eq.gano ? " ganador" : "") },
                el("span", { texto: eq.nombre }),
                puntos[i])));
        if (!yaEstaba) {
            lanzarConfeti($("confeti"));
            puntos.forEach((nodo, i) => animarNumero(nodo, e.equipos[i].puntos, 1400));
        }
        this.mostrar("final");
    },

    /** Programa un paso de la animación entre rondas (se cancelan todos si empieza otra). */
    _paso(ms, fn) {
        this.pasosTransicion.push(setTimeout(fn, ms));
    },

    /**
     * Animación entre rondas.
     * Larga: el robot programa la ronda en su laptop (terminal con líneas que se escriben y barra de progreso),
     * luego baja con el letrero "RONDA N" y los patrocinadores. Corta: solo el letrero.
     */
    mostrarTransicion(e) {
        const ronda = /RONDA (\d+) de (\d+)/.exec(e.ronda || "");
        const multiplicador = /x(\d+)/.exec(e.ronda || "");
        $("transicion-titulo").textContent = e.esFinal ? "¡RONDA FINAL!" : `RONDA ${ronda ? ronda[1] : ""}`;
        $("transicion-sub").textContent = e.esFinal
            ? `Los puntos valen x${multiplicador ? multiplicador[1] : 2}`
            : (ronda ? `de ${ronda[2]}` : "");

        this.pasosTransicion.forEach(clearTimeout);
        this.pasosTransicion = [];
        const capa = $("transicion");
        const larga = e.transicion !== "corta";
        const t = larga ? TRANSICION.larga : TRANSICION.corta;
        capa.hidden = false;
        capa.classList.remove("saliendo");

        const mostrarEscena = escena => {
            capa.dataset.escena = escena;
            capa.classList.remove("activa");
            void capa.offsetWidth;          // reinicia las animaciones de entrada de la escena
            capa.classList.add("activa");
        };

        if (larga) {
            mostrarEscena("programando");
            this._programarTerminal(e, ronda, multiplicador, t);
            this._paso(t.ronda, () => mostrarEscena("ronda"));
        } else {
            mostrarEscena("ronda");
        }
        this._paso(t.fin, () => capa.classList.add("saliendo"));
        this._paso(t.fin + 350, () => { capa.hidden = true; });
    },

    /** Las líneas de la terminal del robot, al ritmo de TRANSICION.larga. */
    _programarTerminal(e, ronda, multiplicador, t) {
        const terminal = $("terminal-texto");
        terminal.replaceChildren();
        const robot = $("robot-programador");
        robot.replaceChildren(robotSVG("normal"));
        robot.classList.remove("feliz");

        const escribir = (texto, clase = "") => {
            const linea = el("div", { clase: `linea-terminal ${clase}` });
            const tecleado = el("span", { clase: "tecleado", texto });
            tecleado.style.setProperty("--n", texto.length);
            linea.append(tecleado);
            terminal.append(linea);
            return linea;
        };
        const numero = e.esFinal ? "final" : (ronda ? ronda[1] : "?");
        const pasos = [
            "Conectando con 100 programadores ........",
            "Recolectando respuestas de la encuesta ..",
            "Ordenando por popularidad ...............",
            e.esFinal
                ? `Activando multiplicador x${multiplicador ? multiplicador[1] : 2} ............`
                : "Escondiendo las respuestas ..............."
        ];
        escribir(`$ ./proxy --ronda ${numero}`, "comando");
        pasos.forEach((texto, i) => this._paso(t.lineas[i], () => {
            const linea = escribir(texto);
            this._paso(t.ok, () => linea.append(el("b", { clase: "ok", texto: " [OK]" })));
        }));

        // Barra de progreso que se llena
        this._paso(t.barra, () => {
            const linea = escribir("Compilando ronda ");
            const barra = el("span", { clase: "barra" });
            linea.append(barra);
            const pasosBarra = 20;
            const inicio = performance.now();
            const llenar = () => {
                const avance = Math.min((performance.now() - inicio) / t.barraDura, 1);
                const llenos = Math.round(avance * pasosBarra);
                barra.textContent = `[${"█".repeat(llenos)}${"░".repeat(pasosBarra - llenos)}] ${Math.round(avance * 100)}%`;
                if (avance < 1 && !$("transicion").hidden) requestAnimationFrame(llenar);
            };
            llenar();
        });
        this._paso(t.exito, () => {
            escribir("✔ BUILD SUCCESSFUL · ¡ronda lista!", "exito");
            robot.replaceChildren(robotSVG("feliz"));
            robot.classList.add("feliz");
        });
    },

    /** Tablero completo o robo exitoso: el robot salta y llueven ceros y unos un momento. */
    festejar() {
        this.reaccionarRobot("feliz", 3200);
        const lluvia = el("div", { clase: "confeti festejo", "aria-hidden": "true" });
        document.body.append(lluvia);
        lanzarConfeti(lluvia);
        setTimeout(() => lluvia.remove(), 3500);
    },

    /** Cuenta regresiva de la portada hasta la hora de inicio que puso el moderador. */
    actualizarCuenta() {
        const nodo = $("cuenta-inicio");
        const partes = /^(\d{1,2}):(\d{2})$/.exec(this.inicio);
        if (!partes) { nodo.hidden = true; return; }
        const meta = new Date();
        meta.setHours(Number(partes[1]), Number(partes[2]), 0, 0);
        const faltan = Math.round((meta - Date.now()) / 1000);
        if (faltan < -30 * 60) { nodo.hidden = true; return; }   // ya pasó hace rato
        nodo.hidden = false;
        if (faltan <= 0) {
            nodo.textContent = "¡YA CASI EMPEZAMOS!";
            return;
        }
        const h = Math.floor(faltan / 3600), m = Math.floor((faltan % 3600) / 60), seg = faltan % 60;
        const dos = n => String(n).padStart(2, "0");
        nodo.textContent = `EMPEZAMOS EN ${h ? `${h}:${dos(m)}` : dos(m)}:${dos(seg)}`;
    },

    /** El robot de la portada "teclea" una frase nueva cada pocos segundos. */
    siguienteFrase() {
        const globo = $("globo-robot");
        const frase = FRASES_ROBOT[this.indiceFrase % FRASES_ROBOT.length];
        this.indiceFrase++;
        const texto = el("span", { clase: "globo-texto", texto: frase });
        texto.style.setProperty("--n", frase.length);
        globo.replaceChildren(texto);
    },

    /** El robotcito del tablero cambia de cara un momento y vuelve a la normalidad. */
    reaccionarRobot(cara, duracion = 1800) {
        const nodo = $("robot-juego");
        if (this.caraRobot !== cara) {
            nodo.replaceChildren(robotSVG(cara));
            nodo.className = `robot robot-juego ${cara}`;
            this.caraRobot = cara;
        }
        clearTimeout(this.temporizadorRobot);
        this.temporizadorRobot = setTimeout(() => {
            nodo.replaceChildren(robotSVG("normal"));
            nodo.className = "robot robot-juego";
            this.caraRobot = null;
        }, duracion);
    },

    /** Las X gigantes, como en la tele, pero con pantallazo de error. */
    mostrarXGrande(cantidad) {
        const robot = el("div", { clase: "robot error" });
        robot.append(robotSVG("error"));
        const capa = el("div", { clase: "x-grande" },
            el("div", { clase: "xs" }, Array.from({ length: cantidad }, () => el("span", { texto: "X" }))),
            robot,
            el("div", { clase: "segfault", texto: "Segmentation fault (core dumped)" }));
        document.body.append(capa);
        setTimeout(() => capa.remove(), 1100);
    },

    alternarPantallaCompleta() {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        } catch { /* el navegador no lo permite: queda F11 */ }
    },

    /** Avisa en la portada si el panel no está mandando nada. */
    revisarPanel() {
        $("estado-panel").textContent = this.recibioEstado
            ? ""
            : "Esperando al panel del moderador… Abre este proyector con el botón ▣ del panel (index.html).";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    dibujarRobots();
    dibujarPatrocinadores($("marquesina"), true);
    dibujarPatrocinadores($("transicion-logos"));
    dibujarPatrocinadores($("final-patrocinadores"));
    Proyector.siguienteFrase();
    setInterval(() => Proyector.siguienteFrase(), 6500);
    setInterval(() => Proyector.actualizarCuenta(), 1000);
    CanalProyector.iniciar((estado, efecto) => Proyector.recibir(estado, efecto));

    document.addEventListener("dblclick", () => Proyector.alternarPantallaCompleta());
    document.addEventListener("fullscreenchange", () => {
        $("ayuda-proyector").hidden = !!document.fullscreenElement;
    });

    // Oculta el cursor cuando no se mueve (se ve más limpio en el proyector)
    let temporizador;
    document.addEventListener("mousemove", () => {
        document.body.classList.remove("sin-cursor");
        clearTimeout(temporizador);
        temporizador = setTimeout(() => document.body.classList.add("sin-cursor"), 2500);
    });

    setTimeout(() => Proyector.revisarPanel(), 1500);
});
