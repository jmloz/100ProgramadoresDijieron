/*
 * ============================================================
 *  PANEL DEL MODERADOR (index.html)
 *  Controla la partida y le manda al proyector lo que debe
 *  mostrar. Toda la lógica de reglas vive en Juego; aquí solo
 *  se traducen los clics/teclas en llamadas a Juego.
 * ============================================================
 */

/* ---------- Modal del moderador ---------- */

const Modal = {
    /**
     * @param {string} titulo
     * @param {string} texto
     * @param {Array<{texto:string, clase?:string, accion?:Function}>} opciones
     */
    abrir(titulo, texto, opciones) {
        $("modal-titulo").textContent = titulo;
        $("modal-texto").textContent = texto;
        const cont = $("modal-opciones");
        cont.replaceChildren(...opciones.map(op =>
            el("button", {
                clase: `btn ${op.clase || ""}`,
                texto: op.texto,
                onclick: () => { this.cerrar(); op.accion && op.accion(); }
            })
        ));
        $("modal").hidden = false;
        UI.pausarPorModal();
        cont.querySelector("button")?.focus();
    },

    cerrar() {
        $("modal").hidden = true;
        UI.reanudarTrasModal();
    },

    get abierto() {
        return !$("modal").hidden;
    }
};

/* ============================================================
 *  AJUSTES DE PRESENTACIÓN: tema (oscuro/claro) y hora de inicio
 *  de la actividad. Se guardan en el navegador y se mandan al
 *  proyector junto con cada estado.
 * ============================================================ */

const Ajustes = {
    clave: "pd-presentacion",
    tema: "oscuro",
    inicio: "",            // "HH:MM" o vacío: la portada del proyector muestra la cuenta regresiva

    cargar() {
        const g = Guardado.leer(this.clave, {});
        this.tema = g.tema === "claro" ? "claro" : "oscuro";
        this.inicio = typeof g.inicio === "string" ? g.inicio : "";
        this.aplicar();
    },

    guardar() {
        Guardado.escribir(this.clave, { tema: this.tema, inicio: this.inicio });
        this.aplicar();
        UI.publicar();
    },

    aplicar() {
        document.documentElement.dataset.tema = this.tema;
        $("btn-tema").textContent = this.tema === "claro" ? "☾ Tema oscuro" : "☀ Tema claro";
        $("hora-inicio").value = this.inicio;
    },

    alternarTema() {
        this.tema = this.tema === "claro" ? "oscuro" : "claro";
        this.guardar();
    }
};

/* ============================================================
 *  CONTROLADOR DE LA PARTIDA
 * ============================================================ */

const MAX_HISTORIAL = 100;

const UI = {
    juego: null,
    config: AlmacenConfig.cargar(),
    aviso: "",                 // mensaje temporal (acierto, error, robo...)
    mostrarRestantes: false,   // al final de la ronda: destapar lo que nadie dijo
    efecto: null,              // efecto para el proyector en el próximo envío (ej. X grande)
    historial: [],             // instantáneas para "deshacer"
    escribiendo: false,        // el moderador está usando la caja de texto
    temporizador: null,
    pausadoPorModal: false,
    ultimoTic: null,

    iniciar() {
        this.temporizador = new Temporizador(() => this.alCambiarReloj(), () => this.alTerminarTiempo());
    },

    iniciarPartida() {
        const banco = AlmacenPreguntas.filtrar(this.config.categorias, this.config.dificultad);
        try {
            this.juego = new Juego(this.config.nombres[0], this.config.nombres[1], banco, this.config);
        } catch (e) {
            Modal.abrir("No se puede iniciar", e.message, [{ texto: "Aceptar" }]);
            return;
        }
        this.historial = [];
        this.escribiendo = false;
        this.temporizador.detener();
        this._nuevaRonda();
        Sonidos.transicion(this.config.transicion, this.juego.esRondaFinal, true);
        mostrarPantalla("juego");
        this.dibujar();
    },

    _nuevaRonda() {
        this.aviso = "";
        this.mostrarRestantes = false;
    },

    nombre(indice) {
        return this.juego.equipos[indice].nombre;
    },

    /* ---------- Instantáneas: deshacer y continuar partida ---------- */

    instantanea() {
        return {
            version: 1,
            config: this.config,
            juego: this.juego.exportar(),
            aviso: this.aviso,
            mostrarRestantes: this.mostrarRestantes
        };
    },

    restaurar(inst) {
        this.juego = Juego.importar(inst.juego);
        this.config = { ...this.config, ...inst.config };
        this.aviso = inst.aviso || "";
        this.mostrarRestantes = !!inst.mostrarRestantes;
        this.temporizador.detener();
    },

    /** Guarda el estado actual antes de una acción, para poder deshacerla. */
    recordar() {
        this.historial.push(JSON.stringify(this.instantanea()));
        if (this.historial.length > MAX_HISTORIAL) this.historial.shift();
    },

    deshacer() {
        if (!this.juego) return;
        const previa = this.historial.pop();
        if (!previa) {
            this.aviso = "No hay nada que deshacer.";
        } else {
            this.restaurar(JSON.parse(previa));
            this.aviso = "↶ Se deshizo la última acción.";
            if (this.juego.fase !== FASES.FIN_JUEGO) mostrarPantalla("juego");
        }
        this.dibujar();
    },

    /** Partida en curso -> localStorage, para "Continuar partida". */
    persistir() {
        if (this.juego) AlmacenPartida.guardar(this.instantanea());
    },

    /** Ejecuta una acción del juego (deshacible) y vuelve a dibujar. */
    accion(fn) {
        this.recordar();
        try {
            this.aviso = "";
            fn();
        } catch (e) {
            this.historial.pop();
            this.aviso = `⚠ ${e.message}`;
        }
        this.dibujar();
    },

    /* ---------- Temporizador ---------- */

    /** Arranca, reinicia o detiene el tiempo según quién debe responder. */
    sincronizarTemporizador() {
        const j = this.juego;
        if (!j.aceptaRespuestas) {
            this.temporizador.detener();
            return;
        }
        const reveladas = j.pregunta.respuestas.filter(r => r.revelada).length;
        const clave = `${j.rondaActual}|${j.fase}|${j.equipoEnTurno}|${reveladas}|${j.errores}`;
        if (this.temporizador.clave === clave) return;
        const segundos = j.fase === FASES.CARA_A_CARA ? this.config.tiempoCara : this.config.tiempoTurno;
        this.ultimoTic = null;
        this.temporizador.iniciar(segundos, clave);
        if (Modal.abierto) {
            this.temporizador.pausar();
            this.pausadoPorModal = true;
        }
    },

    alCambiarReloj() {
        const v = this.temporizador.vista;
        if (v && !v.pausado && v.restante > 0 && v.restante <= 5 && v.restante !== this.ultimoTic) {
            this.ultimoTic = v.restante;
            Sonidos.tic();
        }
        this.dibujarReloj();
        this.publicar();
    },

    alTerminarTiempo() {
        if (!this.juego || !this.juego.aceptaRespuestas) return;
        Sonidos.tiempo();
        this.aplicar(null, "⏰ ¡Se acabó el tiempo! ");
    },

    alternarPausa() {
        if (!this.temporizador.activo) return;
        this.temporizador.alternar();
    },

    pausarPorModal() {
        if (this.temporizador && this.temporizador.activo && !this.temporizador.pausado) {
            this.temporizador.pausar();
            this.pausadoPorModal = true;
        }
    },

    reanudarTrasModal() {
        if (this.pausadoPorModal) {
            this.pausadoPorModal = false;
            this.temporizador.reanudar();
        }
    },

    dibujarReloj() {
        const nodo = $("reloj-juego");
        const v = this.temporizador.vista;
        nodo.hidden = !v;
        if (!v) return;
        nodo.textContent = textoReloj(v, 12);
        nodo.classList.toggle("urgente", v.restante <= 5);
        nodo.classList.toggle("pausado", v.pausado);
        nodo.title = v.pausado ? "Tiempo en pausa (Espacio para reanudar)" : "Segundos para responder";
    },

    /* ---------- Textos compartidos con el proyector ---------- */

    textoTurno() {
        const j = this.juego;
        const turno = j.equipoEnTurno;
        switch (j.fase) {
            case FASES.ELEGIR_PRIMERO: return "⚡ CARA A CARA: pasa un representante de cada equipo";
            case FASES.CARA_A_CARA: return `⚡ Cara a cara: responde ${this.nombre(turno)}`;
            case FASES.DECISION: return `🎯 ${this.nombre(turno)} ganó el cara a cara`;
            case FASES.JUGANDO: return `🎮 Turno de ${this.nombre(turno)}`;
            case FASES.ROBO: return `🦹 ¡${this.nombre(turno)} puede ROBAR ${j.banco} puntos! Una sola oportunidad`;
            case FASES.FIN_RONDA: return `🏁 ${this.nombre(j.ganadorRonda)} se lleva ${j.puntosGanadosRonda} puntos`;
            default: return "";
        }
    },

    textoRonda() {
        const j = this.juego;
        return j.esRondaFinal
            ? `RONDA FINAL · PUNTOS x${j.multiplicador}`
            : `RONDA ${j.rondaActual} de ${j.totalRondas}`;
    },

    /* ---------- Dibujo del panel ---------- */

    dibujar() {
        const j = this.juego;
        if (j.fase === FASES.FIN_JUEGO) return this.mostrarFinal();

        // Marcador
        j.equipos.forEach((eq, i) => {
            const caja = $(`equipo-${i}`);
            caja.querySelector(".equipo-nombre").textContent = eq.nombre;
            caja.querySelector(".equipo-puntos").textContent = eq.puntos;
            caja.classList.toggle("en-turno", j.equipoEnTurno === i);
        });
        $("ronda").textContent = this.textoRonda();
        $("ronda").classList.toggle("final", j.esRondaFinal);
        $("banco").textContent = j.banco;
        $("pregunta").textContent = j.pregunta.texto;

        // Errores ✕ ✕ ✕ (solo cuentan cuando un equipo tiene el control)
        dibujarErrores($("errores"), j.errores, j.maxErrores);

        const turno = $("turno");
        turno.replaceChildren(el("div", { clase: "turno-principal", texto: this.textoTurno() }));
        if (this.aviso) turno.append(el("div", { clase: "aviso", texto: this.aviso }));

        document.querySelectorAll('[data-accion="deshacer"]').forEach(b => { b.disabled = this.historial.length === 0; });

        this.dibujarTarjeta();
        this.dibujarControles();
        this.sincronizarTemporizador();
        this.dibujarReloj();
        this.publicar();
        this.persistir();
    },

    /** Tarjeta privada del moderador: todas las respuestas; clic o número para aceptar una. */
    dibujarTarjeta() {
        const j = this.juego;
        const clicable = j.aceptaRespuestas;
        $("ayuda-tarjeta").textContent = clicable
            ? "Haz clic en una respuesta o presiona su número para aceptarla."
            : "Las respuestas se aceptan cuando un equipo está respondiendo.";
        $("tarjeta-respuestas").replaceChildren(...j.pregunta.respuestas.map((r, i) => {
            const item = el("li", { clase: "item-tarjeta" + (r.revelada ? " revelada" : "") },
                el("span", { clase: "item-num", texto: String(i + 1) }),
                el("span", { clase: "item-cuerpo" },
                    el("span", { clase: "item-texto", texto: r.texto }),
                    r.alias.length ? el("small", { clase: "item-alias", texto: r.alias.join(", ") }) : null),
                el("span", { clase: "item-puntos", texto: r.revelada ? `✔ ${r.puntos}` : String(r.puntos) })
            );
            if (clicable && !r.revelada) {
                item.classList.add("clicable");
                item.title = `Aceptar esta respuesta (tecla ${i + 1})`;
                item.addEventListener("click", () => this.aplicar(r));
            }
            return item;
        }));
    },

    /** Botón con su atajo de teclado visible. */
    _boton(texto, tecla, clase, onclick, extra = {}) {
        return el("button", { clase: `btn ${clase}`, type: "button", onclick, ...extra },
            texto, tecla ? el("kbd", { texto: tecla }) : null);
    },

    dibujarControles() {
        const j = this.juego;
        const cont = $("controles");
        cont.replaceChildren();

        if (j.fase === FASES.ELEGIR_PRIMERO) {
            cont.append(
                el("p", { texto: "¿Quién presionó el botón primero?" }),
                el("div", { clase: "fila-botones" },
                    this._boton(this.nombre(0), "←", "btn-grande", () => this.accion(() => j.elegirPrimero(0))),
                    this._boton(this.nombre(1), "→", "btn-grande", () => this.accion(() => j.elegirPrimero(1))))
            );
            return;
        }

        if (j.fase === FASES.DECISION) {
            cont.append(
                el("p", { texto: `¿${this.nombre(j.equipoControl)} juega o pasa?` }),
                el("div", { clase: "fila-botones" },
                    this._boton("▶ Jugar", "J", "btn-grande", () => this.accion(() => j.decidir(true))),
                    this._boton("↪ Pasar", "P", "btn-grande btn-secundario", () => this.accion(() => j.decidir(false))))
            );
            return;
        }

        if (j.fase === FASES.FIN_RONDA) {
            const botones = el("div", { clase: "fila-botones" });
            if (!this.mostrarRestantes && j.pregunta.pendientes.length > 0) {
                botones.append(this._boton("👁 Revelar restantes", "R", "btn-secundario", () => this.revelarRestantes()));
            }
            const texto = j.esUltimaRonda ? "🏆 Ver resultados"
                : (j.opciones.rondaFinal && j.rondaActual + 1 === j.totalRondas ? "▶ ¡Ronda final!" : "▶ Siguiente ronda");
            botones.append(this._boton(texto, "Enter", "btn-grande", () => this.siguienteRonda()));
            cont.append(botones);
            return;
        }

        // CARA_A_CARA, JUGANDO o ROBO: caja para escribir la respuesta
        const entrada = el("input", {
            id: "entrada-respuesta", maxlength: "80", autocomplete: "off",
            placeholder: "Presiona T para escribir lo que dijo el jugador"
        });
        entrada.addEventListener("focus", () => { this.escribiendo = true; });
        const form = el("form", { clase: "form-respuesta" },
            entrada,
            el("button", { clase: "btn", type: "submit", texto: "Responder" }),
            this._boton(j.fase === FASES.ROBO ? "✕ Falló el robo" : "✕ Error", "X", "btn-error",
                () => this.aplicar(null), { title: "Error directo: no contestó, respuesta incorrecta, etc." })
        );
        form.addEventListener("submit", ev => {
            ev.preventDefault();
            this.procesarEntrada(entrada.value);
        });
        cont.append(form);
        if (this.escribiendo && !Modal.abierto) entrada.focus();
    },

    revelarRestantes() {
        if (this.juego.fase !== FASES.FIN_RONDA || this.mostrarRestantes) return;
        this.recordar();
        this.mostrarRestantes = true;
        Sonidos.revelar();
        this.dibujar();
    },

    siguienteRonda() {
        if (this.juego.fase !== FASES.FIN_RONDA) return;
        this.recordar();
        this.juego.siguienteRonda();
        if (this.juego.fase !== FASES.FIN_JUEGO) Sonidos.transicion(this.config.transicion, this.juego.esRondaFinal);
        this._nuevaRonda(); // antes de dibujar, para no destapar el tablero nuevo
        this.dibujar();
    },

    /* ---------- Proyector ---------- */

    /** Lo que el proyector necesita para dibujarse. Las respuestas ocultas NO se envían. */
    estadoProyector() {
        const j = this.juego;
        const enPartida = ["pantalla-juego", "pantalla-final"].some(id => $(id).classList.contains("activa"));
        if (!j || !enPartida) return { pantalla: "espera" };
        if (j.fase === FASES.FIN_JUEGO) {
            const ganador = j.ganador;
            return {
                pantalla: "final",
                ganador: ganador ? ganador.nombre : null,
                equipos: [...j.equipos].sort((a, b) => b.puntos - a.puntos)
                    .map(e => ({ nombre: e.nombre, puntos: e.puntos, gano: e === ganador }))
            };
        }
        return {
            pantalla: "juego",
            idRonda: `${j.rondaActual}:${j.pregunta.texto}`,
            ronda: this.textoRonda(),
            esFinal: j.esRondaFinal,
            equipos: j.equipos.map(e => ({ nombre: e.nombre, puntos: e.puntos })),
            enTurno: j.equipoEnTurno,
            banco: j.banco,
            pregunta: j.pregunta.texto,
            respuestas: j.pregunta.respuestas.map(r => {
                const visible = r.revelada || this.mostrarRestantes;
                return visible
                    ? { visible: true, texto: r.texto, puntos: r.puntos, noDicha: !r.revelada }
                    : { visible: false };
            }),
            errores: j.errores,
            maxErrores: j.maxErrores,
            transicion: this.config.transicion,
            tiempo: this.temporizador.vista,
            turno: this.textoTurno(),
            aviso: this.aviso
        };
    },

    publicar() {
        const estado = {
            ...this.estadoProyector(),
            tema: Ajustes.tema,
            inicio: Ajustes.inicio,
            patrocinadores: this.config.patrocinadores !== false
        };
        CanalPanel.enviar({ tipo: "estado", estado, efecto: this.efecto });
        this.efecto = null;
    },

    /* ---------- Validación de respuestas ---------- */

    procesarEntrada(texto) {
        const entrada = $("entrada-respuesta");
        if (!String(texto).trim()) {
            entrada?.classList.add("sacudir");
            setTimeout(() => entrada?.classList.remove("sacudir"), 400);
            return;
        }
        const j = this.juego;
        const { tipo, respuesta } = Validador.buscar(texto, j.pregunta.respuestas);

        if (tipo === "exacta") return this.aplicar(respuesta);

        if (tipo === "parecida") {
            if (respuesta.revelada) return this.aplicar(respuesta); // ya está: no hay nada que confirmar
            Modal.abrir(
                "Respuesta dudosa",
                `Se escribió «${texto.trim()}». ¿Cuenta como «${respuesta.texto}»?`,
                [
                    { texto: "✔ Sí, aceptar", accion: () => this.aplicar(respuesta) },
                    { texto: "✕ No, es error", clase: "btn-error", accion: () => this.aplicar(null) },
                    { texto: "Elegir otra…", clase: "btn-secundario", accion: () => this.elegirManual(texto) }
                ]
            );
            return;
        }

        Modal.abrir(
            "¡No está en el tablero!",
            `«${texto.trim()}» no coincide con ninguna respuesta.`,
            [
                { texto: "✕ Confirmar error", clase: "btn-error", accion: () => this.aplicar(null) },
                { texto: "Aceptar manualmente…", clase: "btn-secundario", accion: () => this.elegirManual(texto) }
            ]
        );
    },

    /** El moderador elige a qué respuesta pendiente corresponde lo que se dijo. */
    elegirManual(texto) {
        const pendientes = this.juego.pregunta.pendientes;
        Modal.abrir(
            "Aceptar manualmente",
            `¿A qué respuesta corresponde «${texto.trim()}»?`,
            [
                ...pendientes.map(r => ({
                    texto: `#${this.juego.pregunta.posicionDe(r)} ${r.texto}`,
                    clase: "btn-secundario",
                    accion: () => this.aplicar(r)
                })),
                { texto: "✕ Ninguna: es error", clase: "btn-error", accion: () => this.aplicar(null) }
            ]
        );
    },

    /**
     * Manda la respuesta (o null = error) al juego y reacciona al resultado.
     * @param {string} prefijo texto antes del aviso (ej. "se acabó el tiempo")
     */
    aplicar(respuesta, prefijo = "") {
        const j = this.juego;
        if (!j.aceptaRespuestas) return;
        this.recordar();
        const r = j.responder(respuesta);
        const n = r.equipo != null ? this.nombre(r.equipo) : "";

        switch (r.tipo) {
            case "repetida":
                this.historial.pop(); // no cambió nada: no hay que deshacerlo
                this.aviso = `«${r.respuesta.texto}» ya está en el tablero. Intenta otra.`;
                break;
            case "acierto":
                Sonidos.acierto();
                this.aviso = `✔ ¡${r.respuesta.texto}! +${r.respuesta.puntos * j.multiplicador} al banco`;
                if (r.ganaControl != null) this.aviso += ` · ${this.nombre(r.ganaControl)} gana el control`;
                break;
            case "error":
                Sonidos.error();
                this.efecto = { tipo: "x", cantidad: r.errores || 1 };
                if (r.pasaARobo) this.aviso = `✕ ¡${j.maxErrores === 1 ? "Error" : `${j.maxErrores} errores`}! El control pasa a ${this.nombre(j.otro(r.equipo))}`;
                else if (r.ganaControl != null) this.aviso = `✕ ${n} falló · ${this.nombre(r.ganaControl)} gana el control`;
                else this.aviso = `✕ ${n} falló`;
                break;
            case "ambosFallaron":
                Sonidos.error();
                this.efecto = { tipo: "x", cantidad: 1 };
                this.aviso = "✕ Ninguno atinó. ¡Pasan otros dos representantes!";
                break;
            case "rondaCompleta":
                Sonidos.rondaGanada();
                this.efecto = { tipo: "festejo" };
                this.aviso = `🎉 ¡${this.nombre(r.ganador)} destapó todo el tablero!`;
                break;
            case "roboExitoso":
                Sonidos.rondaGanada();
                this.efecto = { tipo: "festejo" };
                this.aviso = `🦹 ¡${n} robó el banco con «${r.respuesta.texto}»!`;
                break;
            case "roboFallido":
                Sonidos.error();
                this.efecto = { tipo: "x", cantidad: 1 };
                this.aviso = `✕ Robo fallido: el banco es para ${this.nombre(r.ganador)}`;
                break;
        }
        this.aviso = prefijo + this.aviso;
        this.dibujar();
    },

    /* ---------- Atajos de teclado ---------- */

    alPresionarTecla(ev) {
        if (Modal.abierto || !this.juego) return;
        const enJuego = $("pantalla-juego").classList.contains("activa");
        const enFinal = $("pantalla-final").classList.contains("activa");
        if (!enJuego && !enFinal) return;

        const objetivo = ev.target;
        const tecla = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;

        // Dentro de la caja de texto solo nos importa Esc (para volver a los atajos)
        if (objetivo.matches("input, textarea, select")) {
            if (tecla === "Escape") {
                this.escribiendo = false;
                objetivo.blur();
            }
            return;
        }

        if ((ev.ctrlKey || ev.metaKey) && tecla === "z") {
            ev.preventDefault();
            this.deshacer();
            return;
        }
        if (ev.ctrlKey || ev.metaKey || ev.altKey || !enJuego) return;
        // Enter/Espacio sobre un botón con foco: dejar que el navegador lo active
        if (objetivo.matches("button, summary") && (tecla === "Enter" || tecla === " ")) return;

        const j = this.juego;
        const manejar = fn => { ev.preventDefault(); fn(); };

        if (tecla === " ") return manejar(() => this.alternarPausa());

        switch (j.fase) {
            case FASES.ELEGIR_PRIMERO:
                if (tecla === "ArrowLeft") return manejar(() => this.accion(() => j.elegirPrimero(0)));
                if (tecla === "ArrowRight") return manejar(() => this.accion(() => j.elegirPrimero(1)));
                break;
            case FASES.DECISION:
                if (tecla === "j") return manejar(() => this.accion(() => j.decidir(true)));
                if (tecla === "p") return manejar(() => this.accion(() => j.decidir(false)));
                break;
            case FASES.FIN_RONDA:
                if (tecla === "r") return manejar(() => this.revelarRestantes());
                if (tecla === "Enter") return manejar(() => this.siguienteRonda());
                break;
            case FASES.CARA_A_CARA:
            case FASES.JUGANDO:
            case FASES.ROBO: {
                if (/^[1-8]$/.test(tecla)) {
                    const r = j.pregunta.respuestas[Number(tecla) - 1];
                    if (r) return manejar(() => this.aplicar(r));
                    return;
                }
                if (tecla === "x") return manejar(() => this.aplicar(null));
                if (tecla === "t" || tecla === "Enter") {
                    return manejar(() => { this.escribiendo = true; $("entrada-respuesta")?.focus(); });
                }
                break;
            }
        }
    },

    /* ---------- Pantalla final ---------- */

    mostrarFinal() {
        const j = this.juego;
        const ganador = j.ganador;
        this.temporizador.detener();
        $("final-ganador").textContent = ganador ? ganador.nombre : "¡EMPATE!";
        $("final-marcador").replaceChildren(...[...j.equipos]
            .sort((a, b) => b.puntos - a.puntos)
            .map(eq => el("div", { clase: "final-fila" + (eq === ganador ? " ganador" : "") },
                el("span", { texto: eq.nombre }),
                el("strong", { texto: String(eq.puntos) }))));
        const yaEstaba = $("pantalla-final").classList.contains("activa");
        if (!yaEstaba) {
            lanzarConfeti($("confeti"));
            Sonidos.ganador();
        }
        mostrarPantalla("final");
        this.publicar();
        this.persistir();
    }
};

/* ============================================================
 *  PANTALLA DE CONFIGURACIÓN
 * ============================================================ */

const Configuracion = {
    abrir() {
        const c = UI.config;
        $("error-config").textContent = "";
        $("nombre-a").value = c.nombres ? c.nombres[0] : "";
        $("nombre-b").value = c.nombres ? c.nombres[1] : "";
        $("tiempo-cara").value = c.tiempoCara;
        $("tiempo-turno").value = c.tiempoTurno;
        $("dificultad").value = c.dificultad;
        const o = normalizarOpciones(c);
        $("op-rondas").value = o.rondas;
        $("op-final").value = o.rondaFinal ? o.multiplicadorFinal : 0;
        $("op-respuestas").value = o.respuestas;
        $("op-errores").value = o.maxErrores;
        $("op-transicion").value = ["larga", "corta", "no"].includes(c.transicion) ? c.transicion : "larga";
        $("op-patrocinadores").checked = c.patrocinadores !== false;

        $("lista-categorias").replaceChildren(...AlmacenPreguntas.categorias().map(cat =>
            el("label", { clase: "check" },
                Object.assign(el("input", { type: "checkbox", value: cat }),
                    { checked: !c.categorias || c.categorias.includes(cat) }),
                cat)));
        this.actualizarConteo();
        mostrarPantalla("config");
        $("nombre-a").focus();
    },

    categoriasMarcadas() {
        return [...document.querySelectorAll("#lista-categorias input:checked")].map(i => i.value);
    },

    /** Reglas elegidas en el formulario. */
    leerOpciones() {
        const final = Number($("op-final").value);
        return normalizarOpciones({
            rondas: Number($("op-rondas").value),
            rondaFinal: final > 0,
            multiplicadorFinal: final > 0 ? final : 2,
            respuestas: Number($("op-respuestas").value),
            maxErrores: Number($("op-errores").value)
        });
    },

    actualizarConteo() {
        const o = this.leerOpciones();
        const necesarias = preguntasNecesarias(o);
        const n = AlmacenPreguntas.filtrar(this.categoriasMarcadas(), $("dificultad").value).length;
        const nodo = $("conteo-filtro");
        nodo.textContent = `${n} pregunta(s) disponibles · se necesitan ${necesarias}`;
        nodo.classList.toggle("insuficiente", n < necesarias);
        $("resumen-partida").textContent =
            `Partida de ${necesarias} ${necesarias === 1 ? "pregunta" : "preguntas"}: ` +
            `${o.rondas} ${o.rondas === 1 ? "ronda normal" : "rondas normales"}` +
            (o.rondaFinal ? ` + ronda final (puntos x${o.multiplicadorFinal})` : " sin ronda final") +
            ` · ${o.respuestas} respuestas en el tablero · ${o.maxErrores} ${o.maxErrores === 1 ? "error" : "errores"} por turno. ` +
            "Si una pregunta tiene menos respuestas, se muestran las que tenga.";
    },

    leerTiempo(id) {
        const n = Number($(id).value);
        return Number.isInteger(n) && n >= 0 && n <= 120 ? n : null;
    },

    enviar() {
        const a = $("nombre-a").value.trim() || "Equipo A";
        const b = $("nombre-b").value.trim() || "Equipo B";
        const error = texto => { $("error-config").textContent = texto; };

        if (Validador.compactar(a) === Validador.compactar(b)) return error("Los equipos deben tener nombres distintos.");
        const tiempoCara = this.leerTiempo("tiempo-cara");
        const tiempoTurno = this.leerTiempo("tiempo-turno");
        if (tiempoCara === null || tiempoTurno === null) return error("Los tiempos deben ser enteros entre 0 y 120 segundos.");

        const marcadas = this.categoriasMarcadas();
        if (!marcadas.length) return error("Elige al menos una categoría.");
        const todas = AlmacenPreguntas.categorias();
        const dificultad = $("dificultad").value;
        const categorias = marcadas.length === todas.length ? null : marcadas; // null = incluye categorías nuevas
        const opciones = this.leerOpciones();
        const necesarias = preguntasNecesarias(opciones);
        if (AlmacenPreguntas.filtrar(categorias, dificultad).length < necesarias) {
            return error(`Con ese filtro no alcanzan las preguntas: se necesitan ${necesarias}.`);
        }

        UI.config = {
            ...UI.config, nombres: [a, b], tiempoCara, tiempoTurno, categorias, dificultad, ...opciones,
            transicion: $("op-transicion").value,
            patrocinadores: $("op-patrocinadores").checked
        };
        AlmacenConfig.guardar(UI.config);
        UI.iniciarPartida();
    }
};

/* ============================================================
 *  ARRANQUE: menú, navegación y conexión con el proyector
 * ============================================================ */

function actualizarConteo() {
    $("conteo-preguntas").textContent = `${AlmacenPreguntas.todas().length} preguntas en el banco`;
}

/** Muestra "Continuar partida" si hay una partida sin terminar guardada. */
function actualizarMenu() {
    const guardada = AlmacenPartida.cargar();
    const hay = !!guardada && guardada.juego.fase !== FASES.FIN_JUEGO;
    $("btn-continuar").hidden = !hay;
    $("info-continuar").hidden = !hay;
    if (!hay) return;
    const j = guardada.juego;
    const minutos = Math.round((Date.now() - guardada.guardadaEn) / 60000);
    const hace = minutos < 1 ? "hace un momento" : `hace ${minutos} min`;
    $("info-continuar").textContent =
        `${j.equipos[0].nombre} ${j.equipos[0].puntos} – ${j.equipos[1].puntos} ${j.equipos[1].nombre}` +
        ` · ronda ${j.rondaActual} de ${j.totalRondas} · guardada ${hace}`;
}

/** Cambia de pantalla en el panel; fuera del juego el proyector muestra la portada. */
function irA(destino) {
    if (destino === "config") return Configuracion.abrir();
    mostrarPantalla(destino);
    if (destino !== "juego" && destino !== "final") {
        UI.temporizador.detener();
        UI.publicar();
    }
    if (destino === "menu") actualizarMenu();
}

function actualizarEstadoProyector() {
    const conectado = CanalPanel.conectado;
    const nodo = $("estado-proyector");
    nodo.textContent = conectado ? "● Proyector conectado" : "○ Proyector sin abrir";
    nodo.classList.toggle("conectado", conectado);
    $("btn-proyector").textContent = conectado ? "▣ Mostrar proyector" : "▣ Abrir proyector";
}

document.addEventListener("DOMContentLoaded", () => {
    dibujarRobots();
    Ajustes.cargar();
    UI.iniciar();
    actualizarConteo();
    actualizarMenu();
    Editor.iniciar();

    // Cuando el proyector se abre (o se recarga) pide el estado actual
    CanalPanel.alConectar = () => UI.publicar();
    CanalPanel.alCambiarConexion = actualizarEstadoProyector;
    CanalPanel.iniciar();

    $("btn-proyector").addEventListener("click", () => {
        if (!CanalPanel.abrir()) {
            Modal.abrir("Ventana bloqueada",
                "El navegador bloqueó la ventana del proyector. Permite las ventanas emergentes para esta página, " +
                "o abre proyector.html desde la misma carpeta.",
                [{ texto: "Aceptar" }]);
        }
    });

    document.querySelectorAll("[data-ir]").forEach(b =>
        b.addEventListener("click", () => (b.dataset.ir === "agregar" ? Editor.abrir() : irA(b.dataset.ir))));
    document.querySelectorAll('[data-accion="pausa"]').forEach(b => b.addEventListener("click", () => UI.alternarPausa()));
    document.querySelectorAll('[data-accion="deshacer"]').forEach(b => b.addEventListener("click", () => UI.deshacer()));
    document.addEventListener("keydown", ev => UI.alPresionarTecla(ev));

    $("form-config").addEventListener("submit", ev => { ev.preventDefault(); Configuracion.enviar(); });
    $("form-config").addEventListener("change", () => Configuracion.actualizarConteo());

    $("btn-continuar").addEventListener("click", () => {
        const guardada = AlmacenPartida.cargar();
        if (!guardada) return actualizarMenu();
        try {
            UI.restaurar(guardada);
        } catch (e) {
            AlmacenPartida.borrar();
            actualizarMenu();
            Modal.abrir("No se pudo continuar", "La partida guardada está dañada y se descartó.", [{ texto: "Aceptar" }]);
            return;
        }
        UI.historial = [];
        UI.escribiendo = false;
        mostrarPantalla("juego");
        UI.dibujar();
    });

    $("btn-revancha").addEventListener("click", () => UI.iniciarPartida());
    $("btn-final-menu").addEventListener("click", () => {
        AlmacenPartida.borrar();
        irA("menu");
    });

    $("btn-abandonar").addEventListener("click", () =>
        Modal.abrir("Abandonar partida", "Se perderá el marcador actual.", [
            { texto: "Sí, salir al menú", clase: "btn-error", accion: () => { AlmacenPartida.borrar(); irA("menu"); } },
            { texto: "Seguir jugando", clase: "btn-secundario" }
        ]));

    $("btn-salir").addEventListener("click", () => {
        irA("salir");
        if (CanalPanel.ventana && !CanalPanel.ventana.closed) CanalPanel.ventana.close();
        window.close(); // solo funciona si el navegador lo permite
    });

    $("btn-sonido").addEventListener("click", ev => {
        ev.currentTarget.textContent = Sonidos.alternar() ? "♪ ON" : "♪ OFF";
    });
    $("btn-musica").addEventListener("click", ev => {
        const activa = Musica.alternar();
        ev.currentTarget.textContent = activa ? "♫ Música ON" : "♫ Música OFF";
        ev.currentTarget.classList.toggle("btn-secundario", !activa);
    });
    $("btn-tema").addEventListener("click", () => Ajustes.alternarTema());
    $("hora-inicio").addEventListener("change", ev => {
        Ajustes.inicio = ev.target.value;
        Ajustes.guardar();
    });
});
