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
 *  Con OBS: el proyector es una "Fuente de navegador" de OBS, que
 *  es otro programa y no puede recibir postMessage ni
 *  BroadcastChannel del navegador. Si las páginas se abren desde
 *  el servidor local (iniciar-servidor.bat), los mensajes también
 *  pasan por él: el panel los publica y el proyector los consulta.
 *
 *  Mensajes:
 *    panel -> proyector: { tipo: "estado", estado, efecto? }
 *                        { tipo: "sonido", nombre, args }  (si el sonido sale por el proyector)
 *    proyector -> panel: { tipo: "hola" } al cargar, { tipo: "latido" } cada 2 s
 * ============================================================
 */
const Canal = {
    APP: "100-programadores-dijeron",
    sesion: Math.random().toString(36).slice(2),
    secuencia: 0,
    bc: null,
    servidor: false,         // true si la página viene de servidor-obs.ps1
    _ultimoServidor: null,   // id del último mensaje leído del servidor
    _colaServidor: Promise.resolve(),   // los envíos van en orden

    _iniciarBroadcast(alRecibir) {
        try {
            this.bc = new BroadcastChannel(this.APP);
            this.bc.onmessage = ev => alRecibir(ev.data, null);
        } catch {
            this.bc = null; // navegador sin soporte o bloqueado en file://
        }
        window.addEventListener("message", ev => alRecibir(ev.data, ev.source));
    },

    /** Detecta el servidor local y empieza a consultarlo. alListo se llama cuando ya se puede enviar. */
    _iniciarServidor(yo, alRecibir, alListo) {
        if (!location.protocol.startsWith("http")) return;
        fetch("api/ping", { cache: "no-store" })
            .then(r => (r.ok ? r.text() : ""))
            .then(t => { if (t === "ok") this._consultar(yo, alRecibir, alListo); })
            .catch(() => { /* sin servidor (ej. GitHub Pages) */ });
    },

    async _consultar(yo, alRecibir, alListo) {
        for (;;) {
            try {
                const desde = this._ultimoServidor === null ? "" : `&desde=${this._ultimoServidor}`;
                const r = await fetch(`api/canal?para=${yo}${desde}`, { cache: "no-store" });
                const datos = await r.json();
                const primera = this._ultimoServidor === null;
                this._ultimoServidor = datos.ultimo;
                datos.mensajes.forEach(m => alRecibir(m, null));
                if (primera) {
                    this.servidor = true;
                    if (alListo) alListo();
                }
            } catch { /* el servidor se cerró o se está reiniciando: se reintenta */ }
            await new Promise(res => setTimeout(res, 120));
        }
    },

    _enviarServidor(de, msg) {
        if (!this.servidor) return;
        const cuerpo = JSON.stringify(msg);
        this._colaServidor = this._colaServidor
            .then(() => fetch(`api/canal?de=${de}`, { method: "POST", body: cuerpo }))
            .catch(() => { /* servidor caído: el siguiente estado lo corrige */ });
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
    alDetectarServidor: null,
    alCambiarConexion: null,

    iniciar() {
        const alRecibir = (datos, origen) => {
            if (!Canal._esNuestro(datos, "proyector")) return;
            if (origen) this.ventana = origen; // recupera la referencia si el panel se recargó
            const estabaConectado = this.conectado;
            this.ultimoLatido = Date.now();
            if (datos.tipo === "hola" && this.alConectar) this.alConectar();
            if (!estabaConectado && this.alCambiarConexion) this.alCambiarConexion();
        };
        Canal._iniciarBroadcast(alRecibir);
        Canal._iniciarServidor("panel", alRecibir, () => {
            if (this.alDetectarServidor) this.alDetectarServidor();
            if (this.alConectar) this.alConectar();
        });
        // Revisa periódicamente si el proyector sigue vivo
        setInterval(() => this.alCambiarConexion && this.alCambiarConexion(), 2000);
    },

    get conectado() {
        // Con servidor puede haber un proyector en OBS aunque la ventana emergente esté cerrada
        if (this.ventana && this.ventana.closed && !Canal.servidor) return false;
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
        Canal._enviarServidor("panel", msg);
    }
};

/* ---------- Lado del proyector ---------- */

const CanalProyector = {
    ultimaSecuencia: {},     // por sesión del panel, para ignorar mensajes duplicados

    iniciar(alRecibirEstado, alRecibirSonido) {
        const alRecibir = (datos, origen) => {
            if (!Canal._esNuestro(datos, "panel") || !["estado", "sonido"].includes(datos.tipo)) return;
            if (origen && origen !== window.opener) return; // solo aceptamos a quien nos abrió
            // El mismo mensaje puede llegar por postMessage, BroadcastChannel y el servidor
            if (datos.seq <= (this.ultimaSecuencia[datos.sesion] || 0)) return;
            this.ultimaSecuencia[datos.sesion] = datos.seq;
            if (datos.tipo === "sonido") alRecibirSonido(datos.nombre, datos.args);
            else alRecibirEstado(datos.estado, datos.efecto);
        };
        Canal._iniciarBroadcast(alRecibir);
        Canal._iniciarServidor("proyector", alRecibir, () => this.enviar({ tipo: "hola" }));
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
        Canal._enviarServidor("proyector", msg);
    }
};
