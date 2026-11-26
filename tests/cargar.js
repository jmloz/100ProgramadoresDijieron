/*
 * Carga los scripts clásicos del juego en un mismo contexto vm y devuelve
 * sus const/class de nivel superior (que no son propiedades del global).
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");

function cargar(archivos, nombres, opciones = {}) {
    const almacen = opciones.almacen ?? {};
    const localStorage = {
        getItem: k => (Object.prototype.hasOwnProperty.call(almacen, k) ? almacen[k] : null),
        setItem: (k, v) => { almacen[k] = String(v); },
        removeItem: k => { delete almacen[k]; },
        clear: () => { for (const k of Object.keys(almacen)) delete almacen[k]; },
    };
    const ctx = vm.createContext({ localStorage, console, crypto: globalThis.crypto, Math });
    for (const archivo of archivos) {
        const codigo = fs.readFileSync(path.join(RAIZ, archivo), "utf8");
        vm.runInContext(codigo, ctx, { filename: archivo });
    }
    return vm.runInContext("({" + nombres.join(",") + "})", ctx);
}

module.exports = { cargar };
