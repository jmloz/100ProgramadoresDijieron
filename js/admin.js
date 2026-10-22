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
        cont.querySelector("button")?.focus();
    },

    cerrar() {
        $("modal").hidden = true;
    },

    get abierto() {
        return !$("modal").hidden;
    }
};

/* ============================================================
 *  CONTROLADOR DE LA PARTIDA
 * ============================================================ */

const UI = {
    juego: null,
    nombres: ["Equipo A", "Equipo B"],
    aviso: "",                 // mensaje temporal (acierto, error, robo...)
    mostrarRestantes: false,   // al final de la ronda: destapar lo que nadie dijo
    efecto: null,              // efecto para el proyector en el próximo envío (ej. X grande)

    iniciarPartida() {
        try {
            this.juego = new Juego(this.nombres[0], this.nombres[1], AlmacenPreguntas.todas());
        } catch (e) {
            Modal.abrir("No se puede iniciar", e.message, [{ texto: "Aceptar" }]);
            return;
        }
        this._nuevaRonda();
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

    /** Mensaje de turno: se muestra igual en el panel y en el proyector. */
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
        $("errores").querySelectorAll(".x").forEach((x, i) => x.classList.toggle("activa", i < j.errores));

        const turno = $("turno");
        turno.replaceChildren(el("div", { clase: "turno-principal", texto: this.textoTurno() }));
        if (this.aviso) turno.append(el("div", { clase: "aviso", texto: this.aviso }));

        this.dibujarTarjeta();
        this.dibujarControles();
        this.publicar();
    },

    /** Tarjeta privada del moderador: todas las respuestas; clic para aceptar una. */
    dibujarTarjeta() {
        const j = this.juego;
        const clicable = j.aceptaRespuestas;
        $("ayuda-tarjeta").textContent = clicable
            ? "Haz clic en una respuesta para aceptarla."
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
                item.tabIndex = 0;
                item.title = "Aceptar esta respuesta";
                item.addEventListener("click", () => this.aplicar(r));
                item.addEventListener("keydown", ev => {
                    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); this.aplicar(r); }
                });
            }
            return item;
        }));
    },

    dibujarControles() {
        const j = this.juego;
        const cont = $("controles");
        cont.replaceChildren();

        if (j.fase === FASES.ELEGIR_PRIMERO) {
            cont.append(
                el("p", { texto: "¿Quién presionó el botón primero?" }),
                el("div", { clase: "fila-botones" },
                    [0, 1].map(i => el("button", {
                        clase: "btn btn-grande", texto: this.nombre(i),
                        onclick: () => this.accion(() => j.elegirPrimero(i))
                    })))
            );
            return;
        }

        if (j.fase === FASES.DECISION) {
            cont.append(
                el("p", { texto: `¿${this.nombre(j.equipoControl)} juega o pasa?` }),
                el("div", { clase: "fila-botones" },
                    el("button", { clase: "btn btn-grande", texto: "▶ Jugar", onclick: () => this.accion(() => j.decidir(true)) }),
                    el("button", { clase: "btn btn-grande btn-secundario", texto: "↪ Pasar", onclick: () => this.accion(() => j.decidir(false)) }))
            );
            return;
        }

        if (j.fase === FASES.FIN_RONDA) {
            const botones = el("div", { clase: "fila-botones" });
            if (!this.mostrarRestantes && j.pregunta.pendientes.length > 0) {
                botones.append(el("button", {
                    clase: "btn btn-secundario", texto: "👁 Revelar restantes en el proyector",
                    onclick: () => { this.mostrarRestantes = true; Sonidos.revelar(); this.dibujar(); }
                }));
            }
            botones.append(el("button", {
                clase: "btn btn-grande",
                texto: j.esUltimaRonda ? "🏆 Ver resultados" : (j.rondaActual + 1 === j.totalRondas ? "▶ ¡Ronda final!" : "▶ Siguiente ronda"),
                onclick: () => { j.siguienteRonda(); this._nuevaRonda(); this.dibujar(); }
            }));
            cont.append(botones);
            return;
        }

        // CARA_A_CARA, JUGANDO o ROBO: caja para escribir la respuesta
        const entrada = el("input", {
            id: "entrada-respuesta", maxlength: "80", autocomplete: "off",
            placeholder: "Escribe lo que dijo el jugador y presiona Enter"
        });
        const errorTexto = j.fase === FASES.ROBO ? "✕ Falló el robo" : "✕ Error";
        const form = el("form", { clase: "form-respuesta" },
            entrada,
            el("button", { clase: "btn", type: "submit", texto: "Responder" }),
            el("button", {
                clase: "btn btn-error", type: "button", texto: errorTexto,
                title: "Error directo: no contestó, se acabó el tiempo, etc.",
                onclick: () => this.aplicar(null)
            })
        );
        form.addEventListener("submit", ev => {
            ev.preventDefault();
            this.procesarEntrada(entrada.value);
        });
        cont.append(form);
        if (!Modal.abierto) entrada.focus();
    },

    /** Ejecuta una acción del juego y vuelve a dibujar, mostrando cualquier error. */
    accion(fn) {
        try {
            this.aviso = "";
            fn();
        } catch (e) {
            this.aviso = `⚠ ${e.message}`;
        }
        this.dibujar();
    },

    /* ---------- Proyector ---------- */

    /** Lo que el proyector necesita para dibujarse. Las respuestas ocultas NO se envían. */
    estadoProyector() {
        const j = this.juego;
        const enPartida = ["pantalla-juego", "pantalla-final"].some(id => $(id).classList.contains("activa"));
        if (!j || !enPartida) {
            return { pantalla: "espera" };
        }
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
            turno: this.textoTurno(),
            aviso: this.aviso
        };
    },

    publicar() {
        CanalPanel.enviar({ tipo: "estado", estado: this.estadoProyector(), efecto: this.efecto });
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

    /** Manda la respuesta (o null = error) al juego y reacciona al resultado. */
    aplicar(respuesta) {
        const j = this.juego;
        if (!j.aceptaRespuestas) return;
        const r = j.responder(respuesta);
        const n = r.equipo != null ? this.nombre(r.equipo) : "";

        switch (r.tipo) {
            case "repetida":
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
                if (r.pasaARobo) this.aviso = `✕ ¡Tres errores! El control pasa a ${this.nombre(j.otro(r.equipo))}`;
                else if (r.ganaControl != null) this.aviso = `✕ ${n} falló · ${this.nombre(r.ganaControl)} gana el control`;
                else this.aviso = `✕ ${n} falló`;
                break;
            case "ambosFallaron":
                Sonidos.error();
                this.efecto = { tipo: "x", cantidad: 1 };
                this.aviso = "✕ Ninguno atinó. ¡Pasan otros dos representantes!";
                break;
            case "rondaCompleta":
                Sonidos.ganador();
                this.aviso = `🎉 ¡${this.nombre(r.ganador)} destapó todo el tablero!`;
                break;
            case "roboExitoso":
                Sonidos.ganador();
                this.aviso = `🦹 ¡${n} robó el banco con «${r.respuesta.texto}»!`;
                break;
            case "roboFallido":
                Sonidos.error();
                this.efecto = { tipo: "x", cantidad: 1 };
                this.aviso = `✕ Robo fallido: el banco es para ${this.nombre(r.ganador)}`;
                break;
        }
        this.dibujar();
    },

    /* ---------- Pantalla final ---------- */

    mostrarFinal() {
        const j = this.juego;
        const ganador = j.ganador;
        $("final-ganador").textContent = ganador ? ganador.nombre : "¡EMPATE!";
        $("final-marcador").replaceChildren(...[...j.equipos]
            .sort((a, b) => b.puntos - a.puntos)
            .map(eq => el("div", { clase: "final-fila" + (eq === ganador ? " ganador" : "") },
                el("span", { texto: eq.nombre }),
                el("strong", { texto: String(eq.puntos) }))));
        lanzarConfeti($("confeti"));
        mostrarPantalla("final");
        this.publicar();
        Sonidos.ganador();
    }
};

/* ============================================================
 *  PANTALLA "AGREGAR PREGUNTA"
 * ============================================================ */

const Editor = {
    iniciar() {
        const filas = $("filas-respuestas");
        for (let i = 1; i <= MAX_RESPUESTAS; i++) {
            const opcional = i > MIN_RESPUESTAS;
            filas.append(el("div", { clase: "fila-respuesta" },
                el("span", { clase: "num", texto: String(i) }),
                el("input", { clase: "r-texto", maxlength: "50", placeholder: opcional ? "(opcional)" : "Respuesta" }),
                el("input", { clase: "r-puntos", type: "number", min: "1", max: "100", step: "1", placeholder: "pts" }),
                el("input", { clase: "r-alias", maxlength: "200", placeholder: "sinónimo1, sinónimo2" })
            ));
        }
        filas.addEventListener("input", () => this.actualizarSuma());
        $("form-agregar").addEventListener("submit", ev => { ev.preventDefault(); this.guardar(); });
        $("btn-exportar").addEventListener("click", () => this.exportar());
        $("input-importar").addEventListener("change", ev => this.importar(ev.target));
    },

    abrir() {
        $("error-agregar").textContent = "";
        $("ok-agregar").textContent = "";
        this.dibujarLista();
        irA("agregar");
        $("nueva-pregunta").focus();
    },

    leerFormulario() {
        const respuestas = [];
        document.querySelectorAll(".fila-respuesta").forEach(fila => {
            const texto = fila.querySelector(".r-texto").value.trim();
            const puntosTxt = fila.querySelector(".r-puntos").value.trim();
            if (!texto && !puntosTxt) return; // fila vacía
            respuestas.push({
                texto,
                puntos: Number(puntosTxt),
                alias: fila.querySelector(".r-alias").value.split(",").map(a => a.trim()).filter(Boolean)
            });
        });
        return { pregunta: $("nueva-pregunta").value.trim(), respuestas };
    },

    actualizarSuma() {
        const suma = this.leerFormulario().respuestas.reduce((s, r) => s + (Number.isFinite(r.puntos) ? r.puntos : 0), 0);
        const nodo = $("suma-puntos");
        nodo.textContent = suma;
        nodo.classList.toggle("excedido", suma > MAX_PUNTOS_PREGUNTA);
    },

    guardar() {
        $("ok-agregar").textContent = "";
        const datos = this.leerFormulario();
        const errores = AlmacenPreguntas.agregar(datos);
        if (errores.length) {
            $("error-agregar").textContent = errores.join(" ");
            return;
        }
        $("error-agregar").textContent = "";
        $("ok-agregar").textContent = "✔ Pregunta guardada. Ya puede salir en las siguientes partidas.";
        $("form-agregar").reset();
        this.actualizarSuma();
        this.dibujarLista();
        actualizarConteo();
    },

    dibujarLista() {
        const lista = AlmacenPreguntas.personalizadas();
        const ul = $("lista-personalizadas");
        if (!lista.length) {
            ul.replaceChildren(el("li", { clase: "nota", texto: "Aún no has agregado preguntas." }));
            return;
        }
        ul.replaceChildren(...lista.map((p, i) => el("li", {},
            el("span", { texto: `${p.pregunta} (${(p.respuestas || []).length} respuestas)` }),
            el("button", {
                clase: "btn btn-mini btn-error", texto: "Eliminar",
                onclick: () => Modal.abrir("Eliminar pregunta", `¿Eliminar «${p.pregunta}»?`, [
                    { texto: "Eliminar", clase: "btn-error", accion: () => { AlmacenPreguntas.eliminar(i); this.dibujarLista(); actualizarConteo(); } },
                    { texto: "Cancelar", clase: "btn-secundario" }
                ])
            })
        )));
    },

    exportar() {
        const lista = AlmacenPreguntas.personalizadas();
        if (!lista.length) {
            $("error-agregar").textContent = "No hay preguntas personalizadas para exportar.";
            return;
        }
        const blob = new Blob([JSON.stringify(lista, null, 4)], { type: "application/json" });
        const a = el("a", { href: URL.createObjectURL(blob), download: "preguntas-personalizadas.json" });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    importar(input) {
        const archivo = input.files && input.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
            try {
                const { agregadas, rechazadas } = AlmacenPreguntas.importar(JSON.parse(lector.result));
                $("error-agregar").textContent = rechazadas ? `${rechazadas} pregunta(s) inválidas o repetidas no se importaron.` : "";
                $("ok-agregar").textContent = `✔ ${agregadas} pregunta(s) importadas.`;
            } catch (e) {
                $("error-agregar").textContent = `No se pudo importar: ${e.message}`;
            }
            input.value = "";
            this.dibujarLista();
            actualizarConteo();
        };
        lector.readAsText(archivo);
    }
};

/* ============================================================
 *  ARRANQUE: menú, navegación y conexión con el proyector
 * ============================================================ */

function actualizarConteo() {
    $("conteo-preguntas").textContent = `${AlmacenPreguntas.todas().length} preguntas en el banco`;
}

/** Cambia de pantalla en el panel; fuera del juego el proyector muestra la portada. */
function irA(destino) {
    if (destino === "config") {
        $("error-config").textContent = "";
        mostrarPantalla("config");
        $("nombre-a").focus();
    } else {
        mostrarPantalla(destino);
    }
    if (destino !== "juego" && destino !== "final") UI.publicar();
}

function actualizarEstadoProyector() {
    const conectado = CanalPanel.conectado;
    const nodo = $("estado-proyector");
    nodo.textContent = conectado ? "● Proyector conectado" : "○ Proyector sin abrir";
    nodo.classList.toggle("conectado", conectado);
    $("btn-proyector").textContent = conectado ? "📽 Mostrar proyector" : "📽 Abrir proyector";
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarConteo();
    Editor.iniciar();

    // Cuando el proyector se abre (o se recarga) pide el estado actual
    CanalPanel.alConectar = () => UI.publicar();
    CanalPanel.alCambiarConexion = actualizarEstadoProyector;
    CanalPanel.iniciar();

    $("btn-proyector").addEventListener("click", () => {
        if (!CanalPanel.abrir()) {
            Modal.abrir("Ventana bloqueada",
                "El navegador bloqueó la ventana del proyector. Permite las ventanas emergentes para este archivo, " +
                "o abre proyector.html desde la misma carpeta.",
                [{ texto: "Aceptar" }]);
        }
    });

    document.querySelectorAll("[data-ir]").forEach(b =>
        b.addEventListener("click", () => (b.dataset.ir === "agregar" ? Editor.abrir() : irA(b.dataset.ir))));

    $("form-config").addEventListener("submit", ev => {
        ev.preventDefault();
        const a = $("nombre-a").value.trim() || "Equipo A";
        const b = $("nombre-b").value.trim() || "Equipo B";
        if (Validador.compactar(a) === Validador.compactar(b)) {
            $("error-config").textContent = "Los equipos deben tener nombres distintos.";
            return;
        }
        UI.nombres = [a, b];
        UI.iniciarPartida();
    });

    $("btn-revancha").addEventListener("click", () => UI.iniciarPartida());

    $("btn-abandonar").addEventListener("click", () =>
        Modal.abrir("Abandonar partida", "Se perderá el marcador actual.", [
            { texto: "Sí, salir al menú", clase: "btn-error", accion: () => irA("menu") },
            { texto: "Seguir jugando", clase: "btn-secundario", accion: () => UI.dibujar() }
        ]));

    $("btn-salir").addEventListener("click", () => {
        irA("salir");
        if (CanalPanel.ventana && !CanalPanel.ventana.closed) CanalPanel.ventana.close();
        window.close(); // solo funciona si el navegador lo permite
    });

    $("btn-sonido").addEventListener("click", ev => {
        ev.currentTarget.textContent = Sonidos.alternar() ? "🔊" : "🔇";
    });
});
