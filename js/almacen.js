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
    CLAVE_CAMBIOS: "cpd_banco_cambios",

    _copia(x) {
        return JSON.parse(JSON.stringify(x));
    },

    _secuenciaId: 0,

    /** Id único: tiempo + azar + contador (varios ids en el mismo milisegundo no chocan) y que no esté en uso. */
    _idNuevo() {
        const crudo = Guardado.leer(this.CLAVE, []);
        const usados = new Set([...PREGUNTAS_BASE.map(b => b.id),
            ...(Array.isArray(crudo) ? crudo.map(p => p && p.id) : [])]);
        let id;
        do {
            this._secuenciaId++;
            id = "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) +
                this._secuenciaId.toString(36);
        } while (usados.has(id));
        return id;
    },

    /** Personalizadas guardadas; a las que no tienen id se les asigna uno y se guarda la lista (una sola vez). */
    personalizadas() {
        const datos = Guardado.leer(this.CLAVE, []);
        const lista = Array.isArray(datos) ? datos : [];
        let migrada = false;
        const conId = lista.map(p => {
            if (p && typeof p === "object" && !p.id) {
                migrada = true;
                return { ...p, id: this._idNuevo() };
            }
            return p;
        });
        if (migrada) this._guardarLista(conId);
        return conId;
    },

    _guardarLista(lista) {
        return Guardado.escribir(this.CLAVE, lista);
    },

    _cambios() {
        const c = Guardado.leer(this.CLAVE_CAMBIOS, null);
        const ok = c && typeof c === "object";
        return {
            version: 1,
            editadas: ok && c.editadas && typeof c.editadas === "object" && !Array.isArray(c.editadas) ? c.editadas : {},
            desactivadas: ok && Array.isArray(c.desactivadas) ? c.desactivadas : [],
            borradas: ok && Array.isArray(c.borradas) ? c.borradas : []
        };
    },

    /** Guarda los cambios descartando ids que ya no existen en la base ni en las personalizadas. */
    _guardarCambios(cambios) {
        const validos = new Set([...PREGUNTAS_BASE.map(p => p.id), ...this.personalizadas().map(p => p && p.id)]);
        const editadas = {};
        for (const id of Object.keys(cambios.editadas)) if (validos.has(id)) editadas[id] = cambios.editadas[id];
        return Guardado.escribir(this.CLAVE_CAMBIOS, {
            version: 1,
            editadas,
            desactivadas: [...new Set(cambios.desactivadas)].filter(id => validos.has(id)),
            borradas: [...new Set(cambios.borradas)].filter(id => validos.has(id))
        });
    },

    /** Todas las preguntas con su estado. Base primero (orden de archivo) y luego personalizadas. */
    catalogo() {
        const c = this._cambios();
        const estadoDe = id => c.borradas.includes(id) ? "borrada"
            : c.desactivadas.includes(id) ? "desactivada" : "activa";
        const base = PREGUNTAS_BASE.map(b => {
            const editada = Object.prototype.hasOwnProperty.call(c.editadas, b.id);
            return {
                id: b.id,
                datos: { ...this._copia(editada ? c.editadas[b.id] : b), id: b.id },
                origen: "base",
                estado: estadoDe(b.id),
                editada
            };
        });
        const propias = this.personalizadas().filter(p => p && typeof p === "object").map(p => ({
            id: p.id,
            datos: this._copia(p),
            origen: "personalizada",
            estado: c.desactivadas.includes(p.id) ? "desactivada" : "activa",
            editada: false
        }));
        return [...base, ...propias];
    },

    /** Compara con activas y desactivadas, sin contar borradas ni excluirId. */
    _textoOcupado(texto, excluirId) {
        const clave = Validador.compactar(texto);
        return this.catalogo().some(x =>
            x.estado !== "borrada" && x.id !== excluirId &&
            typeof x.datos.pregunta === "string" && Validador.compactar(x.datos.pregunta) === clave);
    },

    porId(id) {
        return this.todas().find(p => p.id === id) || null;
    },

    /**
     * Valida una lista fija de ids (una por ronda) y devuelve las preguntas en ese orden.
     * @param {string[]} ids
     * @param {number} necesarias rondas (+ la final si corresponde)
     * @param {boolean} rondaFinal si la última posición es la ronda final
     * @returns {{preguntas: object[], errores: string[]}}
     */
    resolverLista(ids, necesarias, rondaFinal) {
        const lista = Array.isArray(ids) ? ids : [];
        if (lista.length !== necesarias) {
            return { preguntas: [], errores: [`La lista debe tener ${necesarias} preguntas (tiene ${lista.length}).`] };
        }
        const errores = [];
        const preguntas = [];
        const vistos = new Set();
        lista.forEach((id, i) => {
            const etiqueta = rondaFinal && i === necesarias - 1 ? "ronda final" : `ronda ${i + 1}`;
            if (id === "" || id == null) {
                errores.push(`Falta elegir la pregunta de la ${etiqueta}.`);
                return;
            }
            const p = this.porId(id);
            if (!p) {
                errores.push(`La pregunta de la ${etiqueta} ya no está disponible (desactivada o borrada).`);
            } else if (vistos.has(id)) {
                errores.push(`La pregunta de la ${etiqueta} está repetida.`);
            } else {
                preguntas.push(p);
            }
            vistos.add(id);
        });
        return { preguntas: errores.length ? [] : preguntas, errores };
    },

    /** Agrega una pregunta. Devuelve la lista de errores (vacía si se guardó). */
    agregar(datos) {
        const errores = Pregunta.validarDatos(datos);
        if (errores.length) return errores;
        if (this._textoOcupado(datos.pregunta, null)) return ["Ya existe una pregunta con ese texto."];
        const lista = this.personalizadas();
        lista.push({ ...this._copia(datos), id: this._idNuevo() });
        if (!this._guardarLista(lista)) {
            return ["No se pudo guardar: el navegador bloquea el almacenamiento local."];
        }
        return [];
    },

    /** Edita una pregunta (base: se guarda como edición; personalizada: se reemplaza conservando el id). */
    editar(id, datos) {
        const errores = Pregunta.validarDatos(datos);
        if (errores.length) return errores;
        if (this._textoOcupado(datos.pregunta, id)) return ["Ya existe una pregunta con ese texto."];
        const nuevos = { ...this._copia(datos), id };
        let ok;
        if (PREGUNTAS_BASE.some(b => b.id === id)) {
            const c = this._cambios();
            c.editadas[id] = nuevos;
            ok = this._guardarCambios(c);
        } else {
            const lista = this.personalizadas();
            const i = lista.findIndex(p => p && p.id === id);
            if (i < 0) return ["No existe esa pregunta."];
            lista[i] = nuevos;
            ok = this._guardarLista(lista);
        }
        return ok ? [] : ["No se pudo guardar: el navegador bloquea el almacenamiento local."];
    },

    desactivar(id) {
        const c = this._cambios();
        if (!c.desactivadas.includes(id)) c.desactivadas.push(id);
        this._guardarCambios(c);
    },

    activar(id) {
        const c = this._cambios();
        c.desactivadas = c.desactivadas.filter(x => x !== id);
        this._guardarCambios(c);
    },

    /** Base: va a «borradas» (reversible con restaurar). Personalizada: se elimina. */
    borrar(id) {
        const c = this._cambios();
        c.desactivadas = c.desactivadas.filter(x => x !== id);
        if (PREGUNTAS_BASE.some(b => b.id === id)) {
            if (!c.borradas.includes(id)) c.borradas.push(id);
        } else {
            this._guardarLista(this.personalizadas().filter(p => !(p && p.id === id)));
        }
        this._guardarCambios(c);
    },

    /** Solo base: quita la edición y el borrado. Devuelve errores si el texto original ya existe. */
    restaurar(id) {
        const original = PREGUNTAS_BASE.find(b => b.id === id);
        if (!original) return ["Solo se pueden restaurar preguntas del banco base."];
        if (this._textoOcupado(original.pregunta, id)) {
            return [`No se puede restaurar: «${original.pregunta}» ya existe.`];
        }
        const c = this._cambios();
        delete c.editadas[id];
        c.borradas = c.borradas.filter(x => x !== id);
        this._guardarCambios(c);
        return [];
    },

    /** Importa preguntas desde un arreglo JSON. Devuelve {agregadas, rechazadas}. */
    importar(arreglo) {
        if (!Array.isArray(arreglo)) throw new Error("El archivo debe contener un arreglo [ ... ] de preguntas.");
        let agregadas = 0;
        let rechazadas = 0;
        arreglo.forEach(p => (this.agregar(p).length ? rechazadas++ : agregadas++));
        return { agregadas, rechazadas };
    },

    /** Preguntas activas y válidas. Las inválidas se ignoran con aviso. */
    todas() {
        return this.catalogo().filter(x => x.estado === "activa").map(x => x.datos).filter(p => {
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

/** Configuración de la pantalla del público (requiere pantalla.js cargado antes). */
const AlmacenPantalla = {
    CLAVE: "cpd_pantalla",

    cargar() {
        return normalizarPantalla(Guardado.leer(this.CLAVE, null));
    },

    guardar(pantalla) {
        return Guardado.escribir(this.CLAVE, normalizarPantalla(pantalla));
    },

    restablecer() {
        Guardado.borrar(this.CLAVE);
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
        // Origen de las preguntas: "azar" o "lista" (listaFija = ids en orden)
        modoPreguntas: "azar",
        listaFija: [],
        // Presentación en el proyector
        transicion: "larga",   // "larga" (robot programando), "corta" o "no"
        patrocinadores: true
    }),

    cargar() {
        const guardada = Guardado.leer(this.CLAVE, {});
        const config = { ...this.POR_DEFECTO, ...(guardada && typeof guardada === "object" ? guardada : {}) };
        config.listaFija = Array.isArray(config.listaFija) ? [...config.listaFija] : [];   // nunca la del POR_DEFECTO
        return config;
    },

    guardar(config) {
        Guardado.escribir(this.CLAVE, config);
    }
};

/** Toda la preparación del evento (banco, configuración y pantalla del público) en un solo archivo. */
const Preparacion = {
    TIPO: "100pd-preparacion",

    exportar() {
        const { nombres, ...config } = AlmacenConfig.cargar();
        return {
            tipo: this.TIPO,
            version: 1,
            exportadoEn: new Date().toISOString(),
            personalizadas: AlmacenPreguntas.personalizadas(),
            cambios: AlmacenPreguntas._cambios(),
            config,
            pantalla: AlmacenPantalla.cargar()
        };
    },

    /** Reemplaza todo con lo del archivo (o suma preguntas si es el formato viejo, un arreglo). */
    importar(obj) {
        if (Array.isArray(obj)) return { preguntasIgnoradas: AlmacenPreguntas.importar(obj).rechazadas };
        if (!obj || typeof obj !== "object" || obj.tipo !== this.TIPO) {
            throw new Error("El archivo no es una preparación de 100 Programadores Dijeron.");
        }
        const A = AlmacenPreguntas;
        const entrantes = Array.isArray(obj.personalizadas) ? obj.personalizadas : [];
        const usados = new Set(PREGUNTAS_BASE.map(b => b.id));
        const validas = [];
        for (const p of entrantes) {
            if (!p || typeof p !== "object" || Pregunta.validarDatos(p).length) continue;
            let id = typeof p.id === "string" && p.id && !usados.has(p.id) ? p.id : null;
            if (!id) {
                do { id = A._idNuevo(); } while (usados.has(id));
            }
            usados.add(id);
            validas.push({ ...A._copia(p), id });
        }
        A._guardarLista(validas);

        // Los cambios pasan por la misma limpieza de ids que el resto del almacén.
        // Las ediciones de preguntas base que no pasan la validación se descartan y se cuentan como ignoradas.
        const cambios = obj.cambios && typeof obj.cambios === "object" ? { ...obj.cambios } : {};
        let editadasIgnoradas = 0;
        if (cambios.editadas && typeof cambios.editadas === "object" && !Array.isArray(cambios.editadas)) {
            const editadas = {};
            for (const [id, datos] of Object.entries(cambios.editadas)) {
                const esBase = PREGUNTAS_BASE.some(b => b.id === id);
                if (esBase && (!datos || typeof datos !== "object" || Pregunta.validarDatos(datos).length)) {
                    editadasIgnoradas++;
                    continue;
                }
                editadas[id] = datos;
            }
            cambios.editadas = editadas;
        }
        Guardado.escribir(A.CLAVE_CAMBIOS, cambios);
        A._guardarCambios(A._cambios());

        const nombres = AlmacenConfig.cargar().nombres;
        const config = { ...AlmacenConfig.POR_DEFECTO, ...(obj.config && typeof obj.config === "object" ? obj.config : {}) };
        if (nombres) config.nombres = nombres; else delete config.nombres;
        const existentes = A.categorias();
        const cats = Array.isArray(config.categorias) ? config.categorias.filter(c => existentes.includes(c)) : [];
        config.categorias = cats.length ? cats : null;
        config.listaFija = Array.isArray(config.listaFija) ? config.listaFija.filter(x => typeof x === "string") : [];
        if (config.modoPreguntas !== "lista") config.modoPreguntas = "azar";
        AlmacenConfig.guardar(config);

        AlmacenPantalla.guardar(obj.pantalla);
        return { preguntasIgnoradas: entrantes.length - validas.length + editadasIgnoradas };
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
