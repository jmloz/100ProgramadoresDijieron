/*
 * ============================================================
 *  JUEGO: lógica y reglas de "100 Programadores Dijeron"
 *  No toca la interfaz: la UI llama a estos métodos y luego
 *  vuelve a dibujar la pantalla según `juego.fase`.
 * ============================================================
 *
 *  Flujo de una ronda:
 *   ELEGIR_PRIMERO -> CARA_A_CARA -> DECISION -> JUGANDO -> (ROBO) -> FIN_RONDA
 *  Tras la última ronda: FIN_JUEGO
 */

const FASES = Object.freeze({
    ELEGIR_PRIMERO: "elegirPrimero", // ¿quién presionó el botón primero?
    CARA_A_CARA: "caraACara",        // los dos representantes responden
    DECISION: "decision",            // el ganador del cara a cara decide jugar o pasar
    JUGANDO: "jugando",              // el equipo con control adivina
    ROBO: "robo",                    // el otro equipo tiene UNA oportunidad
    FIN_RONDA: "finRonda",
    FIN_JUEGO: "finJuego"
});

/** Reglas por defecto; el moderador puede cambiarlas al configurar la partida. */
const RONDAS_NORMALES = 3;
const MAX_ERRORES = 3;
const OPCIONES_POR_DEFECTO = Object.freeze({
    rondas: RONDAS_NORMALES,       // rondas normales (cada una usa una pregunta distinta)
    rondaFinal: true,              // + una ronda final con puntos multiplicados
    multiplicadorFinal: 2,
    respuestas: RESPUESTAS_POR_RONDA,  // casillas en el tablero (las más populares de cada pregunta)
    maxErrores: MAX_ERRORES        // errores para perder el control y pasar al robo
});

/** Limpia las opciones: valores fuera de rango vuelven al valor por defecto. */
function normalizarOpciones(o = {}) {
    const entero = (v, min, max, def) => (Number.isInteger(v) && v >= min && v <= max ? v : def);
    const d = OPCIONES_POR_DEFECTO;
    return {
        rondas: entero(o.rondas, 1, 10, d.rondas),
        rondaFinal: typeof o.rondaFinal === "boolean" ? o.rondaFinal : d.rondaFinal,
        multiplicadorFinal: entero(o.multiplicadorFinal, 2, 3, d.multiplicadorFinal),
        respuestas: entero(o.respuestas, 3, MAX_RESPUESTAS, d.respuestas),
        maxErrores: entero(o.maxErrores, 1, 5, d.maxErrores)
    };
}

/** Cuántas preguntas necesita una partida con esas opciones. */
function preguntasNecesarias(opciones) {
    const o = normalizarOpciones(opciones);
    return o.rondas + (o.rondaFinal ? 1 : 0);
}

class Juego {
    /**
     * @param {string} nombreA
     * @param {string} nombreB
     * @param {Array} bancoDatos  preguntas en formato plano (ver preguntas.js)
     * @param {object} opciones   rondas, rondaFinal, multiplicadorFinal, respuestas, maxErrores
     * @param {Function} aleatorio función tipo Math.random (inyectable para pruebas)
     */
    constructor(nombreA, nombreB, bancoDatos, opciones = {}, aleatorio = Math.random) {
        this.equipos = [
            new Equipo(nombreA || "Equipo A"),
            new Equipo(nombreB || "Equipo B")
        ];
        this.opciones = normalizarOpciones(opciones);
        this.totalRondas = preguntasNecesarias(this.opciones);
        this.aleatorio = aleatorio;
        this.preguntas = this._elegirPreguntas(bancoDatos, this.totalRondas);
        this.rondaActual = 0;
        this.iniciarRonda();
    }

    /* ---------- Preparación ---------- */

    /** Baraja (Fisher-Yates) y toma N preguntas distintas: no se repiten en la partida. */
    _elegirPreguntas(bancoDatos, cantidad) {
        if (!Array.isArray(bancoDatos) || bancoDatos.length < cantidad) {
            throw new Error(`Se necesitan al menos ${cantidad} preguntas válidas para jugar.`);
        }
        const copia = [...bancoDatos];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(this.aleatorio() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        // Se crean objetos nuevos para que "revelada" empiece en false cada partida.
        // Solo entran las respuestas más populares: todas las rondas tienen el mismo número de casillas.
        return copia.slice(0, cantidad).map(d => {
            const pregunta = Pregunta.desdeDatos(d);
            pregunta.respuestas = pregunta.respuestas.slice(0, this.opciones.respuestas);
            return pregunta;
        });
    }

    iniciarRonda() {
        this.rondaActual++;
        this.pregunta = this.preguntas[this.rondaActual - 1];
        this.banco = 0;
        this.errores = 0;
        this.equipoControl = null;   // índice 0 o 1
        this.ganadorRonda = null;
        this.puntosGanadosRonda = 0;
        this._reiniciarCaraACara();
    }

    _reiniciarCaraACara() {
        this.fase = FASES.ELEGIR_PRIMERO;
        this.caraACara = { primero: null, turno: null, respuestaPrimero: null };
    }

    /* ---------- Consultas ---------- */

    get esRondaFinal() {
        return this.opciones.rondaFinal && this.rondaActual === this.totalRondas;
    }

    get multiplicador() {
        return this.esRondaFinal ? this.opciones.multiplicadorFinal : 1;
    }

    get maxErrores() {
        return this.opciones.maxErrores;
    }

    get esUltimaRonda() {
        return this.rondaActual >= this.totalRondas;
    }

    otro(indice) {
        return indice === 0 ? 1 : 0;
    }

    /** Índice del equipo que debe responder ahora (o null si nadie). */
    get equipoEnTurno() {
        switch (this.fase) {
            case FASES.CARA_A_CARA: return this.caraACara.turno;
            case FASES.DECISION:
            case FASES.JUGANDO: return this.equipoControl;
            case FASES.ROBO: return this.otro(this.equipoControl);
            default: return null;
        }
    }

    /** ¿Aceptamos respuestas escritas en la fase actual? */
    get aceptaRespuestas() {
        return [FASES.CARA_A_CARA, FASES.JUGANDO, FASES.ROBO].includes(this.fase);
    }

    /** Equipo ganador de la partida, o null si hay empate. */
    get ganador() {
        const [a, b] = this.equipos;
        if (a.puntos === b.puntos) return null;
        return a.puntos > b.puntos ? a : b;
    }

    /* ---------- Acciones ---------- */

    _exigirFase(...fases) {
        if (!fases.includes(this.fase)) {
            throw new Error(`Acción no permitida en la fase "${this.fase}".`);
        }
    }

    /** Revela una respuesta y suma sus puntos (con multiplicador) al banco. */
    _revelar(respuesta) {
        respuesta.revelar();
        this.banco += respuesta.puntos * this.multiplicador;
    }

    /** Cara a cara: el equipo `indice` presionó el botón primero. */
    elegirPrimero(indice) {
        this._exigirFase(FASES.ELEGIR_PRIMERO);
        if (indice !== 0 && indice !== 1) throw new Error("Equipo inválido.");
        this.caraACara = { primero: indice, turno: indice, respuestaPrimero: null };
        this.fase = FASES.CARA_A_CARA;
    }

    /**
     * Registra lo que respondió el equipo en turno (ya validado por la UI y/o el moderador).
     * @param {Respuesta|null} respuesta la respuesta del tablero, o null si fue incorrecta
     * @returns {object} un resumen de lo que pasó, para que la UI muestre mensajes y sonidos
     */
    responder(respuesta) {
        if (respuesta && respuesta.revelada) {
            return { tipo: "repetida", respuesta }; // no cuenta como error
        }
        switch (this.fase) {
            case FASES.CARA_A_CARA: return this._responderCaraACara(respuesta);
            case FASES.JUGANDO: return this._responderJugando(respuesta);
            case FASES.ROBO: return this._responderRobo(respuesta);
            default: throw new Error(`No se aceptan respuestas en la fase "${this.fase}".`);
        }
    }

    _responderCaraACara(respuesta) {
        const cc = this.caraACara;
        const equipo = cc.turno;
        if (respuesta) this._revelar(respuesta);

        if (equipo === cc.primero) {
            // La respuesta #1 gana el control de inmediato
            if (respuesta && this.pregunta.posicionDe(respuesta) === 1) {
                return this._darControl(equipo, respuesta);
            }
            cc.respuestaPrimero = respuesta;
            cc.turno = this.otro(equipo);
            return { tipo: respuesta ? "acierto" : "error", respuesta, equipo, siguiente: cc.turno };
        }

        // Responde el segundo equipo: gana quien tenga la respuesta más alta
        const primera = cc.respuestaPrimero;
        if (!respuesta && !primera) {
            this._reiniciarCaraACara(); // nadie atinó: pasan otros dos representantes
            return { tipo: "ambosFallaron", equipo };
        }
        const ganador = (respuesta && (!primera || respuesta.puntos > primera.puntos))
            ? equipo
            : cc.primero;
        return this._darControl(ganador, respuesta, equipo);
    }

    _darControl(ganador, respuesta, equipo = ganador) {
        this.equipoControl = ganador;
        if (this.pregunta.todasReveladas()) {
            this._terminarRonda(ganador);
            return { tipo: "rondaCompleta", respuesta, equipo, ganador };
        }
        this.fase = FASES.DECISION;
        return { tipo: respuesta ? "acierto" : "error", respuesta, equipo, ganaControl: ganador };
    }

    /** El ganador del cara a cara decide si juega o le pasa el turno al otro equipo. */
    decidir(jugar) {
        this._exigirFase(FASES.DECISION);
        if (!jugar) this.equipoControl = this.otro(this.equipoControl);
        this.errores = 0;
        this.fase = FASES.JUGANDO;
    }

    _responderJugando(respuesta) {
        const equipo = this.equipoControl;
        if (!respuesta) {
            this.errores++;
            if (this.errores >= this.maxErrores) {
                this.fase = FASES.ROBO;
                return { tipo: "error", equipo, errores: this.errores, pasaARobo: true };
            }
            return { tipo: "error", equipo, errores: this.errores };
        }
        this._revelar(respuesta);
        if (this.pregunta.todasReveladas()) {
            this._terminarRonda(equipo);
            return { tipo: "rondaCompleta", respuesta, equipo, ganador: equipo };
        }
        return { tipo: "acierto", respuesta, equipo };
    }

    _responderRobo(respuesta) {
        const ladron = this.otro(this.equipoControl);
        if (respuesta) {
            this._revelar(respuesta);
            this._terminarRonda(ladron);
            return { tipo: "roboExitoso", respuesta, equipo: ladron, ganador: ladron };
        }
        this._terminarRonda(this.equipoControl);
        return { tipo: "roboFallido", equipo: ladron, ganador: this.equipoControl };
    }

    _terminarRonda(ganador) {
        this.ganadorRonda = ganador;
        this.puntosGanadosRonda = this.banco;
        this.equipos[ganador].sumar(this.banco);
        this.fase = FASES.FIN_RONDA;
    }

    /* ---------- Guardar / restaurar (para deshacer y continuar partida) ---------- */

    /** Copia completa del estado como objeto plano (se puede pasar a JSON). */
    exportar() {
        const cc = this.caraACara;
        return {
            equipos: this.equipos.map(e => ({ nombre: e.nombre, puntos: e.puntos })),
            totalRondas: this.totalRondas,
            opciones: this.opciones,
            preguntas: this.preguntas.map(p => p.exportar()),
            rondaActual: this.rondaActual,
            banco: this.banco,
            errores: this.errores,
            equipoControl: this.equipoControl,
            ganadorRonda: this.ganadorRonda,
            puntosGanadosRonda: this.puntosGanadosRonda,
            fase: this.fase,
            caraACara: {
                primero: cc.primero,
                turno: cc.turno,
                // Se guarda la posición, no el objeto, para poder reconstruirlo
                respuestaPrimero: cc.respuestaPrimero ? this.pregunta.respuestas.indexOf(cc.respuestaPrimero) : null
            }
        };
    }

    /** Reconstruye un Juego a partir de lo que devolvió exportar(). */
    static importar(d) {
        const j = Object.create(Juego.prototype);
        j.aleatorio = Math.random;
        j.equipos = d.equipos.map(e => Object.assign(new Equipo(e.nombre), { puntos: e.puntos }));
        j.totalRondas = d.totalRondas;
        // Las partidas guardadas antes de que existieran las opciones usan las reglas por defecto
        j.opciones = normalizarOpciones(d.opciones);
        j.preguntas = d.preguntas.map(Pregunta.importar);
        j.rondaActual = d.rondaActual;
        j.pregunta = j.preguntas[j.rondaActual - 1];
        j.banco = d.banco;
        j.errores = d.errores;
        j.equipoControl = d.equipoControl;
        j.ganadorRonda = d.ganadorRonda;
        j.puntosGanadosRonda = d.puntosGanadosRonda;
        j.fase = d.fase;
        const cc = d.caraACara;
        j.caraACara = {
            primero: cc.primero,
            turno: cc.turno,
            respuestaPrimero: cc.respuestaPrimero == null ? null : j.pregunta.respuestas[cc.respuestaPrimero]
        };
        return j;
    }

    /** Pasa a la siguiente ronda o termina la partida. */
    siguienteRonda() {
        this._exigirFase(FASES.FIN_RONDA);
        if (this.esUltimaRonda) {
            this.fase = FASES.FIN_JUEGO;
        } else {
            this.iniciarRonda();
        }
    }
}

if (typeof module !== "undefined") module.exports = { Juego, FASES, RONDAS_NORMALES, MAX_ERRORES, normalizarOpciones, preguntasNecesarias };
