/*
 * ============================================================
 *  TEMPORIZADOR: cuenta regresiva que se puede pausar
 *  Vive en el panel; el proyector solo muestra los segundos.
 * ============================================================
 */
class Temporizador {
    /**
     * @param {Function} alCambiar se llama cada vez que cambia el segundo mostrado (o se pausa)
     * @param {Function} alTerminar se llama una sola vez al llegar a 0
     */
    constructor(alCambiar, alTerminar) {
        this.alCambiar = alCambiar;
        this.alTerminar = alTerminar;
        this.total = 0;
        this.restanteMs = 0;
        this.inicio = null;       // Date.now() del último arranque; null = pausado o detenido
        this.activo = false;
        this.clave = null;        // identifica "qué" se está cronometrando (turno, jugador...)
        this.intervalo = null;
        this.ultimoMostrado = null;
    }

    /** Arranca de cero una cuenta de `segundos`. 0 o menos = sin límite de tiempo. */
    iniciar(segundos, clave = null) {
        this.detener();
        this.clave = clave;
        if (!(segundos > 0)) return;
        this.total = segundos;
        this.restanteMs = segundos * 1000;
        this.activo = true;
        this.reanudar();
    }

    detener() {
        clearInterval(this.intervalo);
        this.intervalo = null;
        this.inicio = null;
        this.activo = false;
        this.clave = null;
        this.ultimoMostrado = null;
    }

    get pausado() {
        return this.activo && this.inicio === null;
    }

    pausar() {
        if (!this.activo || this.inicio === null) return;
        this.restanteMs -= Date.now() - this.inicio;
        this.inicio = null;
        clearInterval(this.intervalo);
        this.intervalo = null;
        this.alCambiar();
    }

    reanudar() {
        if (!this.activo || this.inicio !== null) return;
        this.inicio = Date.now();
        this.intervalo = setInterval(() => this._tic(), 100);
        this.alCambiar();
    }

    alternar() {
        if (this.pausado) this.reanudar();
        else this.pausar();
    }

    /** Segundos que quedan, redondeados hacia arriba (lo que se muestra). */
    get restante() {
        if (!this.activo) return 0;
        const ms = this.inicio === null ? this.restanteMs : this.restanteMs - (Date.now() - this.inicio);
        return Math.max(0, Math.ceil(ms / 1000));
    }

    /** Estado para mostrar en pantalla, o null si no hay cuenta activa. */
    get vista() {
        return this.activo ? { restante: this.restante, total: this.total, pausado: this.pausado } : null;
    }

    _tic() {
        const r = this.restante;
        if (r !== this.ultimoMostrado) {
            this.ultimoMostrado = r;
            this.alCambiar();
        }
        if (r <= 0) {
            this.detener();
            this.alTerminar();
        }
    }
}
