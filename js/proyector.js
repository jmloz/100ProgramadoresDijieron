/*
 * ============================================================
 *  PROYECTOR (proyector.html)
 *  Pantalla para el público. No tiene lógica de juego: solo
 *  dibuja el estado que le manda el panel del moderador.
 * ============================================================
 */

const Proyector = {
    idRonda: null,
    animadas: new Set(),        // casillas que ya hicieron su animación de volteo
    ultimaPantalla: null,
    recibioEstado: false,

    /** Punto de entrada: llega un estado nuevo desde el panel. */
    recibir(estado, efecto) {
        this.recibioEstado = true;
        this.revisarPanel();
        switch (estado.pantalla) {
            case "juego": this.dibujarJuego(estado); break;
            case "final": this.dibujarFinal(estado); break;
            default: this.mostrar("espera");
        }
        if (efecto && efecto.tipo === "x") this.mostrarXGrande(efecto.cantidad);
    },

    mostrar(pantalla) {
        if (this.ultimaPantalla !== pantalla) mostrarPantalla(pantalla);
        this.ultimaPantalla = pantalla;
    },

    dibujarJuego(e) {
        e.equipos.forEach((eq, i) => {
            const caja = $(`equipo-${i}`);
            caja.querySelector(".equipo-nombre").textContent = eq.nombre;
            caja.querySelector(".equipo-puntos").textContent = eq.puntos;
            caja.classList.toggle("en-turno", e.enTurno === i);
        });
        $("ronda").textContent = e.ronda;
        $("ronda").classList.toggle("final", e.esFinal);
        $("banco").textContent = e.banco;
        $("pregunta").textContent = e.pregunta;
        this.dibujarTablero(e);

        $("errores").querySelectorAll(".x").forEach((x, i) => x.classList.toggle("activa", i < e.errores));

        const turno = $("turno");
        turno.replaceChildren(el("div", { clase: "turno-principal", texto: e.turno }));
        if (e.aviso) turno.append(el("div", { clase: "aviso", texto: e.aviso }));

        this.mostrar("juego");
    },

    dibujarTablero(e) {
        if (this.idRonda !== e.idRonda) {   // ronda nueva: todas las casillas vuelven a animarse
            this.idRonda = e.idRonda;
            this.animadas = new Set();
        }
        const tablero = $("tablero");
        tablero.style.gridTemplateRows = `repeat(${Math.ceil(e.respuestas.length / 2)}, auto)`;
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
                this.animadas.add(i);
            }
            casilla.append(
                el("span", { clase: "texto", texto: r.texto }),
                el("span", { clase: "puntos", texto: String(r.puntos) })
            );
            return casilla;
        }));
    },

    dibujarFinal(e) {
        const yaEstaba = this.ultimaPantalla === "final";
        $("final-ganador").textContent = e.ganador || "¡EMPATE!";
        $("final-marcador").replaceChildren(...e.equipos.map(eq =>
            el("div", { clase: "final-fila" + (eq.gano ? " ganador" : "") },
                el("span", { texto: eq.nombre }),
                el("strong", { texto: String(eq.puntos) }))));
        if (!yaEstaba) lanzarConfeti($("confeti"));
        this.mostrar("final");
    },

    /** Las X gigantes, como en la tele. */
    mostrarXGrande(cantidad) {
        const capa = el("div", { clase: "x-grande" }, Array.from({ length: cantidad }, () => el("span", { texto: "✕" })));
        document.body.append(capa);
        setTimeout(() => capa.remove(), 900);
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
            : "Esperando al panel del moderador… Abre este proyector con el botón 📽 del panel (index.html).";
    }
};

document.addEventListener("DOMContentLoaded", () => {
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
