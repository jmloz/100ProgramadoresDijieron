/*
 * ============================================================
 *  UTILIDADES DE DOM (compartidas por el panel y el proyector)
 * ============================================================
 */

const $ = id => document.getElementById(id);

/** Crea un elemento. Usa textContent, así que el texto del usuario nunca se interpreta como HTML. */
function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
        if (clave === "clase") nodo.className = valor;
        else if (clave === "texto") nodo.textContent = valor;
        else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
        else nodo.setAttribute(clave, valor);
    }
    hijos.flat().forEach(h => h != null && nodo.append(h));
    return nodo;
}

function mostrarPantalla(nombre) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
    $(`pantalla-${nombre}`).classList.add("activa");
    window.scrollTo(0, 0);
}

/** Lluvia de ceros y unos (el "confeti" de la terminal) dentro del contenedor indicado. */
function lanzarConfeti(contenedor) {
    const colores = ["#45d0ff", "#8a4dff", "#1f6bff", "#3fe0a5", "#ffd23f", "#f2f5ff"];
    contenedor.replaceChildren(...Array.from({ length: 70 }, () => {
        const p = el("span", { texto: Math.random() < .5 ? "0" : "1" });
        p.style.left = `${Math.random() * 100}%`;
        p.style.color = colores[Math.floor(Math.random() * colores.length)];
        p.style.fontSize = `${14 + Math.random() * 22}px`;
        p.style.animationDelay = `${Math.random() * 2}s`;
        p.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        return p;
    }));
}

/** Texto del temporizador como barra de progreso: "[██████░░░░] 12s". */
function textoReloj(v, ancho) {
    const llenos = Math.round((v.restante / v.total) * ancho);
    const barra = "█".repeat(llenos) + "░".repeat(ancho - llenos);
    return `${v.pausado ? "⏸ " : ""}[${barra}] ${String(v.restante).padStart(2, " ")}s`;
}

/*
 * ------------------------------------------------------------
 *  MASCOTA: el robot-venado del Congreso PROXY en pixel art
 *  (SVG generado desde un mapa de caracteres). Cada letra es
 *  un color; "." es transparente.
 *  Caras: "normal", "feliz" (acierto/ganador), "error" (X).
 * ------------------------------------------------------------
 */
const ROBOT = {
    colores: {
        o: "#070a1f",   // contorno
        A: "#2b5bd6",   // astas
        c: "#45d0ff",   // luces cian (astas, frente)
        W: "#eef2fb",   // carcasa blanca
        G: "#aab6d6",   // sombra de la carcasa y orejas
        E: "#1b2a6b",   // ojos
        e: "#ffffff",   // brillo de los ojos
        P: "#9fb3ec",   // cachetes
        M: "#1b2a6b",   // boca
        R: "#ff4d5e",   // ojos de error
        D: "#3a4466",   // articulaciones
        B: "#2f8cff"    // panel del pecho
    },
    base: [
        ".A.A........A.A.",
        ".AAA........AAA.",
        "..cA........Ac..",
        "..oooooooooooo..",
        "GoWWWWccccWWWWoG",
        "GoWWWWWWWWWWWWoG",
        ".oWWEEWWWWEEWWo.",
        ".oWWEeWWWWEeWWo.",
        ".oWPWWMWWMWWPWo.",
        ".oWWWWWMMWWWWWo.",
        ".oGGGGGGGGGGGGo.",
        "..oooooooooooo..",
        "....oDDDDDDo....",
        ".DoWWWWWWWWWWoD.",
        ".WoWWWoBBoWWWoW.",
        ".WoWWWoBBoWWWoW.",
        "..oGGGGGGGGGGo..",
        "...oooooooooo..."
    ],
    // Filas de la cara (6 a 9) que cambian según el estado de ánimo
    caras: {
        normal: {},
        feliz: {    // ojos ^ ^ y sonrisa
            6: ".oWWEWWWWWWEWWo.", 7: ".oWEWEWWWWEWEWo."
        },
        error: {    // ojos X X y boca recta
            6: ".oWRWRWWWWRWRWo.", 7: ".oWWRWWWWWWRWWo.", 8: ".oWRWRWWWWRWRWo.",
            9: ".oWWWWMMMMWWWWo."
        }
    }
};

/** Dibuja el robot como SVG con píxeles nítidos. */
function robotSVG(cara = "normal") {
    const ns = "http://www.w3.org/2000/svg";
    const filas = ROBOT.base.map((fila, i) => (ROBOT.caras[cara] || {})[i] || fila);
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 16 ${filas.length}`);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");
    filas.forEach((fila, y) => [...fila].forEach((letra, x) => {
        if (letra === ".") return;
        const px = document.createElementNS(ns, "rect");
        px.setAttribute("x", x); px.setAttribute("y", y);
        px.setAttribute("width", 1.02); px.setAttribute("height", 1.02);
        px.setAttribute("fill", ROBOT.colores[letra]);
        if (letra === "c" || letra === "L") px.classList.add("robot-luz");
        svg.append(px);
    }));
    return svg;
}

/** Pone el robot dentro de cada elemento con data-robot="cara". */
function dibujarRobots(raiz = document) {
    raiz.querySelectorAll("[data-robot]").forEach(nodo => nodo.replaceChildren(robotSVG(nodo.dataset.robot)));
}

/**
 * Cambia un número contando desde el valor anterior (0 → 74), como en los juegos.
 * Si el destino no cambió, no toca nada: así las actualizaciones de cada segundo no cortan la animación.
 */
function animarNumero(nodo, valor, duracion = 650, animarBajada = false) {
    const destino = Number(valor) || 0;
    if (nodo.dataset.destino === String(destino)) return;
    const desde = Number(nodo.textContent) || 0;
    nodo.dataset.destino = String(destino);
    cancelAnimationFrame(nodo._animacion);
    const sinMovimiento = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Bajar contando solo tiene sentido en el banco (pasa a un equipo); en una revancha el marcador salta a 0
    if (desde === destino || sinMovimiento || nodo.textContent === "" || (destino < desde && !animarBajada)) {
        nodo.textContent = String(destino);
        return;
    }
    nodo.classList.remove("contando");
    void nodo.offsetWidth;                // reinicia la animación de "salto" del CSS
    nodo.classList.add("contando");
    const inicio = performance.now();
    const paso = ahora => {
        const avance = Math.min((ahora - inicio) / duracion, 1);
        nodo.textContent = String(Math.round(desde + (destino - desde) * avance));
        if (avance < 1) nodo._animacion = requestAnimationFrame(paso);
    };
    nodo._animacion = requestAnimationFrame(paso);
}

/* ------------------------------------------------------------
 *  PATROCINADORES del Congreso PROXY 2026 (de congresoproxy.com)
 * ------------------------------------------------------------ */
const PATROCINADORES = [
    { archivo: "mc", nombre: "MC Soluciones Industriales y Tecnológicas" },
    { archivo: "aviada", nombre: "Aviada" },
    { archivo: "compu-proveedores", nombre: "Compu Proveedores" },
    { archivo: "global-voip", nombre: "Global Voip" },
    { archivo: "graduaciones-sonora", nombre: "Graduaciones Sonora" },
    { archivo: "interlogic", nombre: "Interlogic" },
    { archivo: "intugo", nombre: "Intugo" },
    { archivo: "necodex", nombre: "Necodex" },
    { archivo: "pinnacle-aerospace", nombre: "Pinnacle Aerospace" }
];

/** Llena un contenedor con los logos de los patrocinadores. Con repetir=true los duplica para la marquesina. */
function dibujarPatrocinadores(contenedor, repetir = false) {
    const lista = repetir ? [...PATROCINADORES, ...PATROCINADORES] : PATROCINADORES;
    contenedor.replaceChildren(...lista.map((p, i) => el("img", {
        src: `img/patrocinadores/${p.archivo}.webp`,
        alt: i < PATROCINADORES.length ? p.nombre : "",
        clase: "logo-patrocinador"
    })));
}

/** Dibuja las X de error: tantas casillas como errores permitidos, encendidas las que ya se cometieron. */
function dibujarErrores(contenedor, errores, maximo) {
    if (contenedor.children.length !== maximo) {
        contenedor.replaceChildren(...Array.from({ length: maximo }, () => el("span", { clase: "x", texto: "X" })));
    }
    [...contenedor.children].forEach((x, i) => x.classList.toggle("activa", i < errores));
}
