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

/** Lluvia de confeti dentro del contenedor indicado. */
function lanzarConfeti(contenedor) {
    const colores = ["#ffd23f", "#ff4d6d", "#3ae374", "#4cc9f0", "#ffffff"];
    contenedor.replaceChildren(...Array.from({ length: 70 }, () => {
        const p = el("span");
        p.style.left = `${Math.random() * 100}%`;
        p.style.background = colores[Math.floor(Math.random() * colores.length)];
        p.style.animationDelay = `${Math.random() * 2}s`;
        p.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        return p;
    }));
}
