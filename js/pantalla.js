/*
 * ============================================================
 *  CONFIGURACIÓN DE LA PANTALLA DEL PÚBLICO
 *  Valores por defecto y normalización (compartidos por el panel y el proyector).
 *  Va justo después de dom.js y antes de almacen.js.
 * ============================================================
 */

/** Congela un objeto y todo lo que contiene. */
function congelarProfundo(x) {
    if (x && typeof x === "object") {
        Object.values(x).forEach(congelarProfundo);
        Object.freeze(x);
    }
    return x;
}

const PANTALLA_POR_DEFECTO = congelarProfundo({
    marca:    { mostrar: true, congreso: "CONGRESO", proxy: "PROXY 2026", edicion: "EDICIÓN XV" },
    boot:     { mostrar: true },
    letrero:  { mostrar: true },
    globo:    { mostrar: true, frases: [
        "¡Hola! Soy el robot de PROXY.",
        "¿Listos para jugar?",
        "Encuestamos a 100 programadores…",
        "…y nadie leyó la documentación.",
        "En mi máquina sí funciona.",
        "Hay 10 tipos de personas: las que saben binario y las que no.",
        "git commit -m \"ya quedó\"",
        "¿Ya intentaron apagarlo y prenderlo?",
        "No es un bug: es una característica sorpresa.",
        "¡Prepárense, equipos!",
        "Crea, conecta y conquista."
    ] },
    lema:     { mostrar: true, texto: "Crea, conecta y conquista." },
    cuenta:   { mostrar: true },
    prompt:   { mostrar: true, texto: "esperando al moderador" },
    marcador: { mostrar: true, texto: "PROXY 2026" },
    laptop:   { mostrar: true },
    creditos: { mostrar: true, texto: "Una actividad del Congreso PROXY 2026 · Ingeniería en Sistemas Computacionales e Informática · TecNM Instituto Tecnológico de Hermosillo" }
});

/** Largo máximo de cada texto editable. */
const LIMITES_PANTALLA = { marca: 20, lema: 60, prompt: 60, frase: 80, frases: 20, marcador: 20, creditos: 200 };

/**
 * Devuelve siempre un objeto nuevo con la forma exacta de PANTALLA_POR_DEFECTO.
 * Cada campo se toma de la entrada solo si tiene el tipo correcto; si no, el default. Nunca lanza.
 */
function normalizarPantalla(entrada) {
    const e = entrada && typeof entrada === "object" && !Array.isArray(entrada) ? entrada : {};
    const D = PANTALLA_POR_DEFECTO;
    const seccion = nombre => {
        const s = e[nombre];
        return s && typeof s === "object" && !Array.isArray(s) ? s : {};
    };
    const mostrar = (s, defecto) => (typeof s.mostrar === "boolean" ? s.mostrar : defecto);
    // Texto recortado; si queda vacío y no se permite vacío, vuelve al default.
    const texto = (s, campo, defecto, limite, permitirVacio) => {
        if (typeof s[campo] !== "string") return defecto;
        const t = s[campo].trim().slice(0, limite);
        return t === "" && !permitirVacio ? defecto : t;
    };

    const marca = seccion("marca");
    const globo = seccion("globo");
    const frases = Array.isArray(globo.frases)
        ? globo.frases
            .filter(f => typeof f === "string")
            .map(f => f.trim().slice(0, LIMITES_PANTALLA.frase))
            .filter(f => f !== "")
            .slice(0, LIMITES_PANTALLA.frases)
        : [...D.globo.frases];

    return {
        marca: {
            mostrar: mostrar(marca, D.marca.mostrar),
            congreso: texto(marca, "congreso", D.marca.congreso, LIMITES_PANTALLA.marca, false),
            proxy: texto(marca, "proxy", D.marca.proxy, LIMITES_PANTALLA.marca, false),
            edicion: texto(marca, "edicion", D.marca.edicion, LIMITES_PANTALLA.marca, false)
        },
        boot:     { mostrar: mostrar(seccion("boot"), D.boot.mostrar) },
        letrero:  { mostrar: mostrar(seccion("letrero"), D.letrero.mostrar) },
        globo:    { mostrar: mostrar(globo, D.globo.mostrar), frases },
        lema:     { mostrar: mostrar(seccion("lema"), D.lema.mostrar),
                    texto: texto(seccion("lema"), "texto", D.lema.texto, LIMITES_PANTALLA.lema, true) },
        cuenta:   { mostrar: mostrar(seccion("cuenta"), D.cuenta.mostrar) },
        prompt:   { mostrar: mostrar(seccion("prompt"), D.prompt.mostrar),
                    texto: texto(seccion("prompt"), "texto", D.prompt.texto, LIMITES_PANTALLA.prompt, false) },
        marcador: { mostrar: mostrar(seccion("marcador"), D.marcador.mostrar),
                    texto: texto(seccion("marcador"), "texto", D.marcador.texto, LIMITES_PANTALLA.marcador, false) },
        laptop:   { mostrar: mostrar(seccion("laptop"), D.laptop.mostrar) },
        creditos: { mostrar: mostrar(seccion("creditos"), D.creditos.mostrar),
                    texto: texto(seccion("creditos"), "texto", D.creditos.texto, LIMITES_PANTALLA.creditos, true) }
    };
}
