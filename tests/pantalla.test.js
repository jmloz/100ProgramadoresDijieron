const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const NOMBRES = ["PANTALLA_POR_DEFECTO", "normalizarPantalla", "LIMITES_PANTALLA"];
const { PANTALLA_POR_DEFECTO: DEF, normalizarPantalla: norm } = cargar(["js/pantalla.js"], NOMBRES);
const json = x => JSON.stringify(x);

test("entradas inválidas devuelven los valores por defecto", () => {
    for (const v of [undefined, null, 5, "x", []]) {
        assert.equal(json(norm(v)), json(DEF));
    }
});

test("un campo suelto cambia solo ese campo", () => {
    const r = norm({ lema: { mostrar: false } });
    assert.equal(r.lema.mostrar, false);
    assert.equal(r.lema.texto, DEF.lema.texto);
    const esperado = JSON.parse(json(DEF));
    esperado.lema.mostrar = false;
    assert.equal(json(r), json(esperado));
});

test("los textos se recortan a su límite", () => {
    assert.equal(norm({ lema: { texto: "a".repeat(100) } }).lema.texto.length, 60);
    assert.equal(norm({ creditos: { texto: "a".repeat(300) } }).creditos.texto.length, 200);
    assert.equal(norm({ globo: { frases: Array.from({ length: 25 }, () => "x") } }).globo.frases.length, 20);
    assert.equal(norm({ globo: { frases: ["a".repeat(100)] } }).globo.frases[0].length, 80);
    assert.equal(json(norm({ globo: { frases: ["", "  ", 3, "Hola"] } }).globo.frases), json(["Hola"]));
});

test("texto vacío: válido en lema, default en marcador, prompt y marca", () => {
    assert.equal(norm({ marcador: { texto: "" } }).marcador.texto, "PROXY 2026");
    assert.equal(norm({ prompt: { texto: "  " } }).prompt.texto, DEF.prompt.texto);
    assert.equal(norm({ marca: { congreso: "" } }).marca.congreso, "CONGRESO");
    assert.equal(norm({ lema: { texto: "" } }).lema.texto, "");
});

test("mostrar no booleano usa el default", () => {
    assert.equal(norm({ marca: { mostrar: "no" } }).marca.mostrar, true);
});

test("el resultado es nuevo y modificable, no comparte los defaults", () => {
    const r = norm(undefined);
    r.globo.frases.push("x");
    r.lema.texto = "otro";
    assert.equal(DEF.globo.frases.length, 11);
    assert.equal(DEF.lema.texto, "Crea, conecta y conquista.");
    assert.ok(Object.isFrozen(DEF) && Object.isFrozen(DEF.globo) && Object.isFrozen(DEF.globo.frases));
});

test("AlmacenPantalla: cargar sin clave da el default; guardar y restablecer", () => {
    const almacen = {};
    const { AlmacenPantalla: A, PANTALLA_POR_DEFECTO: D } =
        cargar(["js/pantalla.js", "js/almacen.js"], ["AlmacenPantalla", "PANTALLA_POR_DEFECTO"], { almacen });
    assert.equal(json(A.cargar()), json(D));
    const p = JSON.parse(json(D));
    p.lema.texto = "Hola";
    A.guardar(p);
    assert.equal(A.cargar().lema.texto, "Hola");
    A.restablecer();
    assert.equal(almacen.cpd_pantalla, undefined);
    assert.equal(json(A.cargar()), json(D));
});

test("publicar() manda la configuración como pantallaPublico y no pisa el selector 'pantalla'", () => {
    const fs = require("node:fs"), path = require("node:path");
    const raiz = path.join(__dirname, "..");
    const admin = fs.readFileSync(path.join(raiz, "js/admin.js"), "utf8");
    const proy = fs.readFileSync(path.join(raiz, "js/proyector.js"), "utf8");
    const bloque = admin.slice(admin.indexOf("    publicar() {"), admin.indexOf("CanalPanel.enviar"));
    assert.match(bloque, /pantallaPublico:\s*PantallaPublico\.actual\(\)/);
    assert.doesNotMatch(bloque, /^\s*pantalla:/m);
    assert.match(proy, /normalizarPantalla\(estado\.pantallaPublico\)/);
    assert.match(proy, /switch \(estado\.pantalla\)/);
});
