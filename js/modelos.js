/*
 * ============================================================
 *  MODELOS: Respuesta, Pregunta y Equipo
 *  Clases de datos puras, sin nada de interfaz (DOM).
 * ============================================================
 */

const MIN_RESPUESTAS = 5;
const MAX_RESPUESTAS = 8;
const MAX_PUNTOS_PREGUNTA = 100;

/** Una respuesta del tablero, con su puntaje y sus sinónimos aceptados. */
class Respuesta {
    constructor(texto, puntos, alias = []) {
        this.texto = String(texto).trim();
        this.puntos = Number(puntos);
        this.alias = (alias || []).map(a => String(a).trim()).filter(a => a.length > 0);
        this.revelada = false;
    }

    revelar() {
        this.revelada = true;
    }

    /** Todas las formas válidas de decir esta respuesta (texto + alias). */
    get formas() {
        return [this.texto, ...this.alias];
    }
}

/** Una pregunta tipo encuesta con 5 a 8 respuestas ordenadas por popularidad. */
class Pregunta {
    constructor(texto, respuestas) {
        this.texto = String(texto).trim();
        // Siempre de la más popular a la menos popular
        this.respuestas = [...respuestas].sort((a, b) => b.puntos - a.puntos);
    }

    /**
     * Revisa que un objeto plano {pregunta, respuestas:[{texto,puntos,alias}]}
     * tenga un formato válido. Devuelve una lista de errores (vacía si todo bien).
     */
    static validarDatos(datos) {
        const errores = [];
        if (!datos || typeof datos !== "object") return ["La pregunta no es un objeto válido."];

        if (typeof datos.pregunta !== "string" || datos.pregunta.trim() === "") {
            errores.push("Falta el texto de la pregunta.");
        }

        const respuestas = Array.isArray(datos.respuestas) ? datos.respuestas : [];
        if (respuestas.length < MIN_RESPUESTAS || respuestas.length > MAX_RESPUESTAS) {
            errores.push(`Debe tener entre ${MIN_RESPUESTAS} y ${MAX_RESPUESTAS} respuestas (tiene ${respuestas.length}).`);
        }

        let suma = 0;
        const vistos = new Set();
        respuestas.forEach((r, i) => {
            const n = i + 1;
            if (!r || typeof r.texto !== "string" || r.texto.trim() === "") {
                errores.push(`La respuesta ${n} no tiene texto.`);
                return;
            }
            if (!Number.isInteger(r.puntos) || r.puntos <= 0) {
                errores.push(`La respuesta ${n} ("${r.texto}") debe tener puntos enteros mayores a 0.`);
            } else {
                suma += r.puntos;
            }
            if (r.alias !== undefined && !Array.isArray(r.alias)) {
                errores.push(`Los alias de la respuesta ${n} deben ser una lista.`);
            }
            const clave = Validador.compactar(r.texto);
            if (vistos.has(clave)) errores.push(`La respuesta "${r.texto}" está repetida.`);
            vistos.add(clave);
        });

        if (suma > MAX_PUNTOS_PREGUNTA) {
            errores.push(`Los puntos suman ${suma}; el máximo es ${MAX_PUNTOS_PREGUNTA}.`);
        }
        return errores;
    }

    /** Crea una Pregunta a partir de un objeto plano. Lanza Error si es inválido. */
    static desdeDatos(datos) {
        const errores = Pregunta.validarDatos(datos);
        if (errores.length > 0) throw new Error(errores.join(" "));
        return new Pregunta(
            datos.pregunta,
            datos.respuestas.map(r => new Respuesta(r.texto, r.puntos, r.alias))
        );
    }

    get pendientes() {
        return this.respuestas.filter(r => !r.revelada);
    }

    todasReveladas() {
        return this.respuestas.every(r => r.revelada);
    }

    /** Lugar en el tablero (1 = la más popular). */
    posicionDe(respuesta) {
        return this.respuestas.indexOf(respuesta) + 1;
    }
}

/** Un equipo con su nombre y su marcador. */
class Equipo {
    constructor(nombre) {
        this.nombre = String(nombre).trim();
        this.puntos = 0;
    }

    sumar(puntos) {
        this.puntos += puntos;
    }
}

if (typeof module !== "undefined") {
    module.exports = { Respuesta, Pregunta, Equipo, MIN_RESPUESTAS, MAX_RESPUESTAS, MAX_PUNTOS_PREGUNTA };
}
