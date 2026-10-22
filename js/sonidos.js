/*
 * ============================================================
 *  SONIDOS: generados con Web Audio API (no necesita archivos mp3)
 * ============================================================
 */
const Sonidos = {
    contexto: null,
    activo: true,

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

    /** Toca una nota. inicio y duracion en segundos. */
    _nota(frecuencia, inicio, duracion, tipo = "sine", volumen = 0.25) {
        const ctx = this._ctx();
        if (!ctx || !this.activo) return;
        const t = ctx.currentTime + inicio;
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, t);
        gan.gain.setValueAtTime(0.0001, t);
        gan.gain.exponentialRampToValueAtTime(volumen, t + 0.02);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
        osc.connect(gan).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duracion + 0.05);
    },

    acierto() {
        this._nota(880, 0, 0.15, "triangle");
        this._nota(1320, 0.12, 0.35, "triangle");
    },

    error() {
        this._nota(110, 0, 0.6, "sawtooth", 0.3);
        this._nota(104, 0, 0.6, "square", 0.15);
    },

    revelar() {
        this._nota(520, 0, 0.12, "sine", 0.15);
    },

    ganador() {
        const notas = [523, 659, 784, 1047, 784, 1047];
        notas.forEach((f, i) => this._nota(f, i * 0.16, 0.3, "triangle", 0.3));
    },

    alternar() {
        this.activo = !this.activo;
        return this.activo;
    }
};
