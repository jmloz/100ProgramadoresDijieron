/*
 * ============================================================
 *  ALMACÉN DE PREGUNTAS
 *  Junta las preguntas de preguntas.js con las que el usuario
 *  agrega desde el menú (guardadas en el navegador).
 * ============================================================
 */
const AlmacenPreguntas = {
    CLAVE: "cpd_preguntas_personalizadas",

    personalizadas() {
        try {
            const datos = JSON.parse(localStorage.getItem(this.CLAVE) || "[]");
            return Array.isArray(datos) ? datos : [];
        } catch {
            return []; // almacenamiento bloqueado o datos corruptos
        }
    },

    _guardarLista(lista) {
        try {
            localStorage.setItem(this.CLAVE, JSON.stringify(lista));
            return true;
        } catch {
            return false;
        }
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
    }
};
