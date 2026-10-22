/*
 * ============================================================
 *  INTERFAZ: pantallas, tablero, marcador y modal del moderador
 *  Toda la lógica de reglas vive en Juego; aquí solo se dibuja
 *  y se traducen los clics/teclas en llamadas a Juego.
 * ============================================================
 */

/* ---------- Utilidades de DOM ---------- */

const $ = id => document.getElementById(id);

/** Crea un elemento. Usa textContent, así que el texto del usuario nunca se interpreta como HTML. */
function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
        if (clave === "clase") nodo.className = valor;
        else if (clave === "texto") nodo.textContent = valor;
        else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
        else nodo.setAttribute(clave, valor);
    }
    hijos.flat().forEach(h => h != null && nodo.append(h));
    return nodo;
}

function mostrarPantalla(nombre) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
    $(`pantalla-${nombre}`).classList.add("activa");
    window.scrollTo(0, 0);
}

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
    animadas: new Set(),       // respuestas cuya animación ya se mostró
    mostrarRestantes: false,   // al final de la ronda: destapar lo que nadie dijo

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
        this.animadas = new Set();
        this.mostrarRestantes = false;
    },

    nombre(indice) {
        return this.juego.equipos[indice].nombre;
    },

    /* ---------- Dibujo ---------- */

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
        $("ronda").textContent = j.esRondaFinal
            ? `RONDA FINAL · PUNTOS x${j.multiplicador}`
            : `RONDA ${j.rondaActual} de ${j.totalRondas}`;
        $("ronda").classList.toggle("final", j.esRondaFinal);
        $("banco").textContent = j.banco;

        $("pregunta").textContent = j.pregunta.texto;
        this.dibujarTablero();

        // Errores ✕ ✕ ✕ (solo cuentan cuando un equipo tiene el control)
        $("errores").querySelectorAll(".x").forEach((x, i) => x.classList.toggle("activa", i < j.errores));

        this.dibujarTurno();
        this.dibujarControles();
    },

    dibujarTablero() {
        const resp = this.juego.pregunta.respuestas;
        const tablero = $("tablero");
        tablero.style.gridTemplateRows = `repeat(${Math.ceil(resp.length / 2)}, auto)`;
        tablero.replaceChildren(...resp.map((r, i) => {
            const visible = r.revelada || this.mostrarRestantes;
            const casilla = el("div", { clase: "casilla" });
            if (!visible) {
                casilla.append(el("span", { clase: "numero", texto: String(i + 1) }));
                return casilla;
            }
            casilla.classList.add("revelada");
            if (!r.revelada) casilla.classList.add("no-dicha");
            if (!this.animadas.has(r)) {
                casilla.classList.add("animar");
                this.animadas.add(r);
            }
            casilla.append(
                el("span", { clase: "texto", texto: r.texto }),
                el("span", { clase: "puntos", texto: String(r.puntos) })
            );
            return casilla;
        }));
    },

    dibujarTurno() {
        const j = this.juego;
        const turno = j.equipoEnTurno;
        let msg;
        switch (j.fase) {
            case FASES.ELEGIR_PRIMERO:
                msg = "⚡ CARA A CARA: pasa un representante de cada equipo"; break;
            case FASES.CARA_A_CARA:
                msg = `⚡ Cara a cara: responde ${this.nombre(turno)}`; break;
            case FASES.DECISION:
                msg = `🎯 ${this.nombre(turno)} ganó el cara a cara`; break;
            case FASES.JUGANDO:
                msg = `🎮 Turno de ${this.nombre(turno)}`; break;
            case FASES.ROBO:
                msg = `🦹 ¡${this.nombre(turno)} puede ROBAR ${j.banco} puntos! Una sola oportunidad`; break;
            case FASES.FIN_RONDA:
                msg = `🏁 ${this.nombre(j.ganadorRonda)} se lleva ${j.puntosGanadosRonda} puntos`; break;
        }
        const cont = $("turno");
        cont.replaceChildren(el("div", { clase: "turno-principal", texto: msg }));
        if (this.aviso) cont.append(el("div", { clase: "aviso", texto: this.aviso }));
    },

    dibujarControles() {
        const j = this.juego;
        const cont = $("controles");
        cont.replaceChildren();

        if (j.fase === FASES.ELEGIR_PRIMERO) {
            cont.append(
                el("p", { texto: "Moderador: ¿quién presionó el botón primero?" }),
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
                    clase: "btn btn-secundario", texto: "👁 Revelar restantes",
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
            placeholder: "Escribe la respuesta y presiona Enter"
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
                "Moderador: respuesta dudosa",
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
                { texto: "Moderador: aceptar manualmente…", clase: "btn-secundario", accion: () => this.elegirManual(texto) }
            ]
        );
    },

    /** El moderador elige a qué respuesta pendiente corresponde lo que se dijo. */
    elegirManual(texto) {
        const pendientes = this.juego.pregunta.pendientes;
        Modal.abrir(
            "Moderador: aceptar manualmente",
            `¿A qué respuesta corresponde «${texto.trim()}»? (no lo muestres al público 🤫)`,
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
                this.mostrarXGrande(r.errores || 1);
                if (r.pasaARobo) this.aviso = `✕ ¡Tres errores! El control pasa a ${this.nombre(j.otro(r.equipo))}`;
                else if (r.ganaControl != null) this.aviso = `✕ ${n} falló · ${this.nombre(r.ganaControl)} gana el control`;
                else this.aviso = `✕ ${n} falló`;
                break;
            case "ambosFallaron":
                Sonidos.error();
                this.mostrarXGrande(1);
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
                this.mostrarXGrande(1);
                this.aviso = `✕ Robo fallido: el banco es para ${this.nombre(r.ganador)}`;
                break;
        }
        this.dibujar();
    },

    /** Muestra las X gigantes en pantalla como en la tele. */
    mostrarXGrande(cantidad) {
        const capa = el("div", { clase: "x-grande" }, Array.from({ length: cantidad }, () => el("span", { texto: "✕" })));
        document.body.append(capa);
        setTimeout(() => capa.remove(), 900);
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
        this.lanzarConfeti();
        mostrarPantalla("final");
        Sonidos.ganador();
    },

    lanzarConfeti() {
        const colores = ["#ffd23f", "#ff4d6d", "#3ae374", "#4cc9f0", "#ffffff"];
        $("confeti").replaceChildren(...Array.from({ length: 70 }, () => {
            const p = el("span");
            p.style.left = `${Math.random() * 100}%`;
            p.style.background = colores[Math.floor(Math.random() * colores.length)];
            p.style.animationDelay = `${Math.random() * 2}s`;
            p.style.animationDuration = `${2.5 + Math.random() * 2}s`;
            return p;
        }));
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
        mostrarPantalla("agregar");
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
 *  ARRANQUE: menú y navegación
 * ============================================================ */

function actualizarConteo() {
    $("conteo-preguntas").textContent = `${AlmacenPreguntas.todas().length} preguntas en el banco`;
}

function irA(destino) {
    if (destino === "agregar") return Editor.abrir();
    if (destino === "config") {
        $("error-config").textContent = "";
        mostrarPantalla("config");
        $("nombre-a").focus();
        return;
    }
    mostrarPantalla(destino);
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarConteo();
    Editor.iniciar();

    document.querySelectorAll("[data-ir]").forEach(b =>
        b.addEventListener("click", () => irA(b.dataset.ir)));

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
            { texto: "Sí, salir al menú", clase: "btn-error", accion: () => mostrarPantalla("menu") },
            { texto: "Seguir jugando", clase: "btn-secundario", accion: () => UI.dibujar() }
        ]));

    $("btn-salir").addEventListener("click", () => {
        mostrarPantalla("salir");
        window.close(); // solo funciona si el navegador lo permite
    });

    $("btn-sonido").addEventListener("click", ev => {
        ev.currentTarget.textContent = Sonidos.alternar() ? "🔊" : "🔇";
    });
});
