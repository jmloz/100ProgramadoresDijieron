/*
 * ============================================================
 *  SONIDOS: estilo chiptune / 8 bits, generados con Web Audio API
 *  (no necesita archivos mp3). Ondas cuadradas y triangulares,
 *  arpegios rápidos, barridos de tono y ruido blanco, como una
 *  consola de los 80.
 * ============================================================
 */
const Sonidos = {
    contexto: null,
    activo: true,
    _ruidoBuffer: null,

    _ctx() {
        try {
            if (!this.contexto) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return null;
                this.contexto = new Ctx();
            }
            if (this.contexto.state === "suspended") this.contexto.resume();
            return this.contexto;
        } catch {
            return null; // sin audio: el juego sigue funcionando
        }
    },

    /**
     * Toca una nota. inicio y duracion en segundos.
     * Si se da frecuenciaFinal, el tono se desliza hacia ella (barrido).
     */
    _nota(frecuencia, inicio, duracion, tipo = "square", volumen = 0.12, frecuenciaFinal = null) {
        const ctx = this._ctx();
        if (!ctx || !this.activo) return;
        Musica.agachar();
        this._tono(ctx.destination, ctx.currentTime + inicio, frecuencia, duracion, tipo, volumen, frecuenciaFinal);
    },

    /** Ráfaga de ruido blanco (explosiones, golpes, estática). */
    _ruido(inicio, duracion, volumen = 0.15, frecuenciaFiltro = 1800) {
        const ctx = this._ctx();
        if (!ctx || !this.activo) return;
        Musica.agachar();
        this._golpe(ctx.destination, ctx.currentTime + inicio, duracion, volumen, frecuenciaFiltro);
    },

    /** Oscilador con envolvente seca, sin ataque suave: así suenan los chips de las consolas. t es tiempo absoluto. */
    _tono(destino, t, frecuencia, duracion, tipo, volumen, frecuenciaFinal = null) {
        const ctx = this.contexto;
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, t);
        if (frecuenciaFinal) osc.frequency.exponentialRampToValueAtTime(frecuenciaFinal, t + duracion);
        gan.gain.setValueAtTime(volumen, t);
        gan.gain.setValueAtTime(volumen, t + duracion * 0.7);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
        osc.connect(gan).connect(destino);
        osc.start(t);
        osc.stop(t + duracion + 0.02);
    },

    _golpe(destino, t, duracion, volumen, frecuenciaFiltro) {
        const ctx = this.contexto;
        if (!this._ruidoBuffer) {
            const n = ctx.sampleRate;
            this._ruidoBuffer = ctx.createBuffer(1, n, n);
            const datos = this._ruidoBuffer.getChannelData(0);
            for (let i = 0; i < n; i++) datos[i] = Math.random() * 2 - 1;
        }
        const fuente = ctx.createBufferSource();
        const filtro = ctx.createBiquadFilter();
        const gan = ctx.createGain();
        fuente.buffer = this._ruidoBuffer;
        filtro.type = "lowpass";
        filtro.frequency.setValueAtTime(frecuenciaFiltro, t);
        gan.gain.setValueAtTime(volumen, t);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
        fuente.connect(filtro).connect(gan).connect(destino);
        fuente.start(t);
        fuente.stop(t + duracion + 0.02);
    },

    /** Arpegio: varias notas seguidas muy rápido. */
    _arpegio(frecuencias, inicio, paso, tipo = "square", volumen = 0.12) {
        frecuencias.forEach((f, i) => this._nota(f, inicio + i * paso, paso * 1.1, tipo, volumen));
    },

    /** Respuesta correcta: "moneda" de plataforma. */
    acierto() {
        this._nota(988, 0, 0.08, "square", 0.12);
        this._nota(1319, 0.08, 0.35, "square", 0.12);
    },

    /** Error: zumbido descendente + golpe de estática. */
    error() {
        this._nota(220, 0, 0.45, "square", 0.14, 55);
        this._nota(233, 0, 0.45, "sawtooth", 0.06, 58);
        this._ruido(0, 0.25, 0.18, 900);
    },

    /** Revelar respuestas: pequeño "blip" de menú. */
    revelar() {
        this._nota(660, 0, 0.05, "square", 0.08);
        this._nota(880, 0.05, 0.07, "square", 0.08);
    },

    /** Inicio de partida: jingle de "PRESS START". */
    inicio() {
        this._arpegio([262, 330, 392, 523], 0, 0.07, "square", 0.1);
        this._nota(659, 0.3, 0.12, "square", 0.1);
        this._nota(784, 0.42, 0.3, "square", 0.1);
        this._nota(131, 0.3, 0.42, "triangle", 0.25);
    },

    /** Ronda ganada (tablero completo o robo): "power-up" ascendente. */
    rondaGanada() {
        this._nota(200, 0, 0.35, "square", 0.08, 1600);
        this._arpegio([523, 659, 784, 1047, 1319], 0.3, 0.06, "square", 0.1);
        this._nota(1568, 0.62, 0.25, "triangle", 0.2);
    },

    /** Fin del juego: fanfarria de victoria con bajo. */
    ganador() {
        const melodia = [[523, 0.12], [523, 0.12], [523, 0.12], [523, 0.36], [415, 0.36], [466, 0.36], [523, 0.24], [466, 0.12], [523, 0.7]];
        let t = 0;
        melodia.forEach(([f, d]) => { this._nota(f, t, d * 0.95, "square", 0.1); t += d; });
        const bajo = [[131, 0.72], [104, 0.36], [117, 0.36], [131, 1.06]];
        t = 0;
        bajo.forEach(([f, d]) => { this._nota(f, t, d * 0.95, "triangle", 0.25); t += d; });
    },

    /** Nueva ronda: fanfarria corta "¡ROUND 2!". retraso en segundos. */
    nuevaRonda(esFinal = false, retraso = 0) {
        const r = retraso;
        const base = esFinal ? [392, 494, 587, 784] : [330, 415, 494, 659];
        this._arpegio(base, r, 0.09, "square", 0.1);
        this._nota(base[3], r + 0.4, 0.18, "square", 0.1);
        this._nota(base[3] * 1.5, r + 0.6, 0.45, "square", 0.1);
        this._nota(base[0] / 2, r + 0.4, 0.65, "triangle", 0.25);
        this._ruido(r + 0.4, 0.12, 0.08, 5000);
        if (esFinal) this._nota(base[3] * 2, r + 0.95, 0.5, "triangle", 0.18);
    },

    /**
     * Sonido de la animación entre rondas (va al mismo ritmo que la del proyector, ver TRANSICION en proyector.js):
     * "larga": el robot teclea, cada línea termina con un blip, la barra de progreso sube de tono,
     * suena el "build exitoso" y luego la fanfarria de la ronda.
     */
    transicion(tipo, esFinal = false, esInicio = false) {
        if (tipo !== "larga") {
            if (esInicio) this.inicio();
            else this.nuevaRonda(esFinal);
            return;
        }
        // Teclazos del robot
        for (let t = 0.3; t < 5.3; t += 0.06 + Math.random() * 0.07) {
            this._ruido(t, 0.018, 0.05, 3500 + Math.random() * 3000);
        }
        // [OK] al terminar cada línea
        [0.9, 1.8, 2.7, 3.6].forEach(t => {
            this._nota(988, t, 0.05, "square", 0.06);
            this._nota(1319, t + 0.05, 0.08, "square", 0.06);
        });
        // Barra de progreso
        for (let i = 0; i < 10; i++) this._nota(262 * Math.pow(2, i / 8), 3.9 + i * 0.14, 0.08, "square", 0.05);
        // Build exitoso
        this._arpegio([523, 659, 784, 1047], 5.4, 0.07, "square", 0.09);
        this.nuevaRonda(esFinal, 6.0);
    },

    /** Tic de los últimos segundos del temporizador. */
    tic() {
        this._nota(1760, 0, 0.03, "square", 0.06);
        this._ruido(0, 0.02, 0.05, 6000);
    },

    /** Chicharra de "¡se acabó el tiempo!": game over. */
    tiempo() {
        this._arpegio([392, 370, 349, 330], 0, 0.14, "square", 0.12);
        this._nota(311, 0.56, 0.5, "square", 0.12, 150);
    },

    alternar() {
        this.activo = !this.activo;
        Musica.ajustarVolumen();
        return this.activo;
    }
};

/*
 * ============================================================
 *  MÚSICA DE FONDO: loop chiptune generado en vivo (sin archivos).
 *  Progresión La menor - Fa - Do - Sol con bajo triangular,
 *  arpegio de onda cuadrada y platillo de ruido. Baja de volumen
 *  sola cuando suena un efecto (acierto, error, etc.).
 * ============================================================
 */
const Musica = {
    activa: false,
    volumen: 0.05,
    ganancia: null,
    reloj: null,
    paso: 0,
    siguiente: 0,
    tempo: 118,
    // Acordes en notas MIDI (La menor, Fa, Do, Sol), 16 pasos (semicorcheas) cada uno
    acordes: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
    // Melodía simple sobre los 64 pasos (null = silencio)
    melodia: [
        76, null, 74, null, 72, null, 74, null, 76, null, null, null, 76, null, 72, null,
        77, null, 76, null, 74, null, 72, null, 69, null, null, null, null, null, null, null,
        72, null, 74, null, 76, null, 79, null, 76, null, 74, null, 72, null, 74, null,
        74, null, 71, null, 74, null, 79, null, 78, null, null, null, null, null, null, null
    ],

    _hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); },

    alternar() {
        if (this.activa) this.detener();
        else this.iniciar();
        return this.activa;
    },

    iniciar() {
        const ctx = Sonidos._ctx();
        if (!ctx) return;
        this.ganancia = ctx.createGain();
        this.ganancia.connect(ctx.destination);
        this.activa = true;
        this.ajustarVolumen();
        this.paso = 0;
        this.siguiente = ctx.currentTime + 0.1;
        // Programa las notas un poco antes de que suenen, para que no se atrasen
        this.reloj = setInterval(() => this._programar(), 50);
    },

    detener() {
        this.activa = false;
        clearInterval(this.reloj);
        if (this.ganancia) {
            const g = this.ganancia, t = Sonidos.contexto.currentTime;
            g.gain.cancelScheduledValues(t);
            g.gain.setValueAtTime(g.gain.value, t);
            g.gain.linearRampToValueAtTime(0, t + 0.3);
            setTimeout(() => g.disconnect(), 400);
            this.ganancia = null;
        }
    },

    ajustarVolumen() {
        if (!this.ganancia) return;
        const t = Sonidos.contexto.currentTime;
        this.ganancia.gain.cancelScheduledValues(t);
        this.ganancia.gain.setValueAtTime(Sonidos.activo ? this.volumen : 0, t);
    },

    /** Baja la música un momento para que se escuche el efecto. */
    agachar() {
        if (!this.ganancia || !Sonidos.activo) return;
        const g = this.ganancia.gain, t = Sonidos.contexto.currentTime;
        g.cancelScheduledValues(t);
        g.setValueAtTime(this.volumen * 0.2, t);
        g.setValueAtTime(this.volumen * 0.2, t + 0.9);
        g.linearRampToValueAtTime(this.volumen, t + 1.6);
    },

    _programar() {
        const ctx = Sonidos.contexto;
        const duracionPaso = 60 / this.tempo / 4;
        while (this.siguiente < ctx.currentTime + 0.25) {
            this._tocarPaso(this.paso, this.siguiente, duracionPaso);
            this.siguiente += duracionPaso;
            this.paso = (this.paso + 1) % 64;
        }
    },

    _tocarPaso(paso, t, d) {
        const acorde = this.acordes[Math.floor(paso / 16)];
        const enCompas = paso % 16;
        const destino = this.ganancia;
        // Bajo: negras alternando fundamental y quinta
        if (enCompas % 4 === 0) {
            const nota = (enCompas % 8 === 0 ? acorde[0] : acorde[2]) - 24;
            Sonidos._tono(destino, t, this._hz(nota), d * 3.5, "triangle", 0.9);
        }
        // Arpegio en corcheas
        if (enCompas % 2 === 0) {
            Sonidos._tono(destino, t, this._hz(acorde[(enCompas / 2) % 3] + 12), d * 1.6, "square", 0.18);
        }
        // Melodía
        const m = this.melodia[paso];
        if (m) Sonidos._tono(destino, t, this._hz(m), d * 1.8, "square", 0.3);
        // Platillo en los contratiempos
        if (enCompas % 4 === 2) Sonidos._golpe(destino, t, 0.04, 0.25, 8000);
    }
};
