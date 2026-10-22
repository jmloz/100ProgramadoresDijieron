/*
 * ============================================================
 *  CANAL DE COMUNICACIÓN: panel del moderador <-> proyector
 * ============================================================
 *  Las dos ventanas viven en la misma computadora. El panel abre
 *  el proyector con window.open() y le manda el estado del juego
 *  con postMessage (funciona incluso abriendo los archivos con
 *  doble clic, sin servidor).
 *
 *  Si el proyector se abrió a mano (sin window.open), se usa
 *  BroadcastChannel como respaldo cuando el navegador lo permite.
 *
 *  Mensajes:
 *    panel -> proyector: { tipo: "estado", estado, efecto? }
 *    proyector -> panel: { tipo: "hola" } al cargar, { tipo: "latido" } cada 2 s
 * ============================================================
 */
const Canal = {
    APP: "100-programadores-dijeron",
    sesion: Math.random().toString(36).slice(2),
    secuencia: 0,
    bc: null,

    _iniciarBroadcast(alRecibir) {
        try {
            this.bc = new BroadcastChannel(this.APP);
            this.bc.onmessage = ev => alRecibir(ev.data, null);
        } catch {
            this.bc = null; // navegador sin soporte o bloqueado en file://
        }
        window.addEventListener("message", ev => alRecibir(ev.data, ev.source));
    },

    _empaquetar(de, datos) {
        return { app: this.APP, de, sesion: this.sesion, seq: ++this.secuencia, ...datos };
    },

    _esNuestro(datos, de) {
        return datos && datos.app === this.APP && datos.de === de;
    }
};

/* ---------- Lado del panel del moderador ---------- */

const CanalPanel = {
    ventana: null,          // referencia a la ventana del proyector
    ultimoLatido: 0,
    alConectar: null,       // callback: el proyector pide el estado actual
    alCambiarConexion: null,

    iniciar() {
        Canal._iniciarBroadcast((datos, origen) => {
            if (!Canal._esNuestro(datos, "proyector")) return;
            if (origen) this.ventana = origen; // recupera la referencia si el panel se recargó
            const estabaConectado = this.conectado;
            this.ultimoLatido = Date.now();
            if (datos.tipo === "hola" && this.alConectar) this.alConectar();
            if (!estabaConectado && this.alCambiarConexion) this.alCambiarConexion();
        });
        // Revisa periódicamente si el proyector sigue vivo
        setInterval(() => this.alCambiarConexion && this.alCambiarConexion(), 2000);
    },

    get conectado() {
        if (this.ventana && this.ventana.closed) return false;
        return Date.now() - this.ultimoLatido < 5000;
    },

    /** Abre (o enfoca) la ventana del proyector. Devuelve false si el navegador bloqueó la ventana. */
    abrir() {
        if (this.ventana && !this.ventana.closed) {
            this.ventana.focus();
            return true;
        }
        this.ventana = window.open("proyector.html", "cpd-proyector", "popup,width=1280,height=760");
        return !!this.ventana;
    },

    enviar(datos) {
        const msg = Canal._empaquetar("panel", datos);
        try {
            if (this.ventana && !this.ventana.closed) this.ventana.postMessage(msg, "*");
        } catch { /* ventana cerrada a medio envío */ }
        try {
            Canal.bc && Canal.bc.postMessage(msg);
        } catch { /* sin BroadcastChannel */ }
    }
};

/* ---------- Lado del proyector ---------- */

const CanalProyector = {
    ultimaSecuencia: {},     // por sesión del panel, para ignorar mensajes duplicados

    iniciar(alRecibirEstado) {
        Canal._iniciarBroadcast((datos, origen) => {
            if (!Canal._esNuestro(datos, "panel") || datos.tipo !== "estado") return;
            if (origen && origen !== window.opener) return; // solo aceptamos a quien nos abrió
            // El mismo mensaje puede llegar por postMessage y por BroadcastChannel
            if (datos.seq <= (this.ultimaSecuencia[datos.sesion] || 0)) return;
            this.ultimaSecuencia[datos.sesion] = datos.seq;
            alRecibirEstado(datos.estado, datos.efecto);
        });
        this.enviar({ tipo: "hola" });
        setInterval(() => this.enviar({ tipo: "latido" }), 2000);
    },

    enviar(datos) {
        const msg = Canal._empaquetar("proyector", datos);
        try {
            if (window.opener && !window.opener.closed) window.opener.postMessage(msg, "*");
        } catch { /* el panel se cerró */ }
        try {
            Canal.bc && Canal.bc.postMessage(msg);
        } catch { /* sin BroadcastChannel */ }
    }
};
