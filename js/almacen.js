/*
 * ============================================================
 *  ALMACENAMIENTO EN EL NAVEGADOR (localStorage)
 *   - AlmacenPreguntas: preguntas de preguntas.js + las agregadas desde el menú
 *   - AlmacenConfig:    tiempos, categorías y dificultad
 *   - AlmacenPartida:   la partida en curso, para continuarla si se cierra el navegador
 *  Si el navegador bloquea el almacenamiento, el juego sigue funcionando sin guardar.
 * ============================================================
 */

/** Lee/escribe JSON en localStorage sin romper el juego si falla. */
const Guardado = {
    leer(clave, porDefecto) {
        try {
            const texto = localStorage.getItem(clave);
            return texto == null ? porDefecto : JSON.parse(texto);
        } catch {
            return porDefecto;
        }
    },

    escribir(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch {
            return false;
        }
    },

    borrar(clave) {
        try {
            localStorage.removeItem(clave);
        } catch { /* nada que borrar */ }
    }
};

const AlmacenPreguntas = {
    CLAVE: "cpd_preguntas_personalizadas",

    personalizadas() {
        const datos = Guardado.leer(this.CLAVE, []);
        return Array.isArray(datos) ? datos : [];
    },

    _guardarLista(lista) {
        return Guardado.escribir(this.CLAVE, lista);
    },

    /** Agrega una pregunta. Devuelve la lista de errores (vacía si se guardó). */
    agregar(datos) {
        const errores = Pregunta.validarDatos(datos);
        if (errores.length) return errores;
        const lista = this.personalizadas();
        const clave = Validador.compactar(datos.pregunta);
        if (this.todas().some(p => Validador.compactar(p.pregunta) === clave)) {
            return ["Ya existe una pregunta con ese texto."];
        }
        lista.push(datos);
        if (!this._guardarLista(lista)) {
            return ["No se pudo guardar: el navegador bloquea el almacenamiento local."];
        }
        return [];
    },

    eliminar(indice) {
        const lista = this.personalizadas();
        lista.splice(indice, 1);
        this._guardarLista(lista);
    },

    /** Importa preguntas desde un arreglo JSON. Devuelve {agregadas, rechazadas}. */
    importar(arreglo) {
        if (!Array.isArray(arreglo)) throw new Error("El archivo debe contener un arreglo [ ... ] de preguntas.");
        let agregadas = 0;
        let rechazadas = 0;
        arreglo.forEach(p => (this.agregar(p).length ? rechazadas++ : agregadas++));
        return { agregadas, rechazadas };
    },

    /** Todas las preguntas válidas (base + personalizadas). Las inválidas se ignoran con aviso. */
    todas() {
        return [...PREGUNTAS_BASE, ...this.personalizadas()].filter(p => {
            const errores = Pregunta.validarDatos(p);
            if (errores.length) console.warn("Pregunta ignorada:", p && p.pregunta, errores);
            return errores.length === 0;
        });
    },

    categoriaDe(p) {
        return (p.categoria && p.categoria.trim()) || CATEGORIA_POR_DEFECTO;
    },

    /** Lista ordenada de categorías existentes. */
    categorias() {
        return [...new Set(this.todas().map(p => this.categoriaDe(p)))].sort((a, b) => a.localeCompare(b, "es"));
    },

    /**
     * Preguntas que cumplen el filtro.
     * @param {string[]|null} categorias null = todas
     * @param {string} dificultad "todas" o una clave de DIFICULTADES
     */
    filtrar(categorias, dificultad) {
        return this.todas().filter(p =>
            (!categorias || categorias.includes(this.categoriaDe(p))) &&
            (dificultad === "todas" || (p.dificultad || "media") === dificultad));
    }
};

const AlmacenConfig = {
    CLAVE: "cpd_config",
    POR_DEFECTO: Object.freeze({
        tiempoCara: 10,        // segundos para responder en el cara a cara (0 = sin tiempo)
        tiempoTurno: 20,       // segundos por respuesta con el control y en el robo
        categorias: null,      // null = todas
        dificultad: "todas",
        // Reglas (ver OPCIONES_POR_DEFECTO en juego.js)
        rondas: 3,
        rondaFinal: true,
        multiplicadorFinal: 2,
        respuestas: 5,
        maxErrores: 3,
        // Presentación en el proyector
        transicion: "larga",   // "larga" (robot programando), "corta" o "no"
        patrocinadores: true
    }),

    cargar() {
        const guardada = Guardado.leer(this.CLAVE, {});
        return { ...this.POR_DEFECTO, ...(guardada && typeof guardada === "object" ? guardada : {}) };
    },

    guardar(config) {
        Guardado.escribir(this.CLAVE, config);
    }
};

const AlmacenPartida = {
    CLAVE: "cpd_partida",

    guardar(instantanea) {
        Guardado.escribir(this.CLAVE, { ...instantanea, guardadaEn: Date.now() });
    },

    cargar() {
        const p = Guardado.leer(this.CLAVE, null);
        return p && p.version === 1 && p.juego ? p : null;
    },

    borrar() {
        Guardado.borrar(this.CLAVE);
    }
};
