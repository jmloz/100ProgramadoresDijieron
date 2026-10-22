/*
 * ============================================================
 *  VALIDADOR DE RESPUESTAS
 *  Compara lo que escribe el jugador contra las respuestas
 *  del tablero ignorando mayúsculas, acentos y espacios extra.
 * ============================================================
 *
 *  Resultado de Validador.buscar(entrada, respuestas):
 *    { tipo: "exacta",   respuesta }  -> coincide con el texto o un alias
 *    { tipo: "parecida", respuesta }  -> se parece (typo o frase que la contiene);
 *                                        el moderador debe confirmar
 *    { tipo: "ninguna",  respuesta: null }
 */
const Validador = {
    /** "  ¡Stack   OVERFLÓW! " -> "stack overflow". Conserva + y # (C++, C#). */
    normalizar(texto) {
        return String(texto ?? "")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")   // quita acentos y la tilde de la ñ
            .toLowerCase()
            .replace(/[^a-z0-9+#\s]/g, " ")    // signos de puntuación -> espacio
            .replace(/\s+/g, " ")
            .trim();
    },

    /** Igual que normalizar pero sin espacios: "stack overflow" == "stackoverflow". */
    compactar(texto) {
        return this.normalizar(texto).replace(/\s/g, "");
    },

    /**
     * Distancia de edición (Damerau-Levenshtein): número mínimo de letras a
     * cambiar, insertar, borrar o intercambiar ("chatgtp" -> "chatgpt" = 1).
     */
    levenshtein(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const d = Array.from({ length: a.length + 1 }, (_, i) =>
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const costo = a[i - 1] === b[j - 1] ? 0 : 1;
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // letras intercambiadas
                }
            }
        }
        return d[a.length][b.length];
    },

    /** Cuántos errores de dedo toleramos según el largo de la palabra. */
    tolerancia(largo) {
        if (largo < 4) return 0;   // "x", "c", "js": deben escribirse exactos
        if (largo <= 7) return 1;
        return 2;
    },

    buscar(entrada, respuestas) {
        const compacta = this.compactar(entrada);
        const normal = this.normalizar(entrada);
        if (!compacta) return { tipo: "ninguna", respuesta: null };

        // 1) Coincidencia exacta con el texto o algún alias
        for (const r of respuestas) {
            if (r.formas.some(f => this.compactar(f) === compacta)) {
                return { tipo: "exacta", respuesta: r };
            }
        }

        // 2) La frase contiene una respuesta completa: "pues buscar en google" -> "google"
        //    Se elige la forma más larga para evitar falsos positivos.
        let mejor = null;
        let largoMejor = 0;
        for (const r of respuestas) {
            for (const f of r.formas) {
                const fn = this.normalizar(f);
                if (fn.length >= 4 && ` ${normal} `.includes(` ${fn} `) && fn.length > largoMejor) {
                    mejor = r;
                    largoMejor = fn.length;
                }
            }
        }
        if (mejor) return { tipo: "parecida", respuesta: mejor };

        // 3) Errores de dedo: "stak overflo", "javscript"
        let distanciaMejor = Infinity;
        for (const r of respuestas) {
            for (const f of r.formas) {
                const fc = this.compactar(f);
                const d = this.levenshtein(compacta, fc);
                if (d <= this.tolerancia(Math.min(fc.length, compacta.length)) && d < distanciaMejor) {
                    mejor = r;
                    distanciaMejor = d;
                }
            }
        }
        if (mejor) return { tipo: "parecida", respuesta: mejor };

        return { tipo: "ninguna", respuesta: null };
    }
};

if (typeof module !== "undefined") module.exports = { Validador };
