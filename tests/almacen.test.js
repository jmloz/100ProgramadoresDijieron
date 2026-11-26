const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const ARCHIVOS = ["js/validador.js", "js/modelos.js", "js/preguntas.js", "js/almacen.js"];
function nuevo(almacen = {}) {
    const r = cargar(ARCHIVOS, ["AlmacenPreguntas", "PREGUNTAS_BASE"], { almacen });
    return { ...r, almacen, base: id => JSON.parse(JSON.stringify(r.PREGUNTAS_BASE.find(p => p.id === id))) };
}
const sinId = p => { const { id, ...resto } = p; return resto; };
const estado = (A, id) => A.catalogo().find(x => x.id === id).estado;

test("migra ids de personalizadas viejas", () => {
    const { PREGUNTAS_BASE } = cargar(["js/preguntas.js"], ["PREGUNTAS_BASE"]);
    const vieja = JSON.parse(JSON.stringify(sinId(PREGUNTAS_BASE[0])));
    vieja.pregunta = "Pregunta propia de prueba";
    const almacen = { cpd_preguntas_personalizadas: JSON.stringify([vieja]) };
    const { AlmacenPreguntas: A } = nuevo(almacen);
    const id = A.personalizadas()[0].id;
    assert.match(id, /^p-/);
    assert.equal(JSON.parse(almacen.cpd_preguntas_personalizadas)[0].id, id);
    assert.equal(A.personalizadas()[0].id, id);
});

test("todas() incluye las 27 base con id", () => {
    const { AlmacenPreguntas: A } = nuevo();
    assert.equal(A.todas().length, 27);
    assert.equal(A.todas()[0].id, "b01");
});

test("editar una base cambia la vista y restaurar la devuelve", () => {
    const { AlmacenPreguntas: A, base } = nuevo();
    const b01 = base("b01");
    assert.deepEqual([...A.editar("b01", { ...b01, pregunta: "Otra cosa" })], []);
    assert.equal(A.porId("b01").pregunta, "Otra cosa");
    assert.equal(A.catalogo().find(x => x.id === "b01").editada, true);
    assert.deepEqual([...A.restaurar("b01")], []);
    assert.equal(A.porId("b01").pregunta, b01.pregunta);
});

test("desactivar saca de todas() pero sigue en catalogo()", () => {
    const { AlmacenPreguntas: A } = nuevo();
    A.desactivar("b02");
    assert.equal(A.todas().length, 26);
    assert.equal(estado(A, "b02"), "desactivada");
    A.activar("b02");
    assert.equal(A.todas().length, 27);
});

test("borrar base es reversible, borrar personalizada no", () => {
    const { AlmacenPreguntas: A, base } = nuevo();
    A.borrar("b03");
    assert.equal(estado(A, "b03"), "borrada");
    assert.deepEqual([...A.restaurar("b03")], []);
    assert.equal(estado(A, "b03"), "activa");
    const nueva = { ...sinId(base("b01")), pregunta: "Totalmente nueva" };
    assert.deepEqual([...A.agregar(nueva)], []);
    const id = A.personalizadas()[0].id;
    A.borrar(id);
    assert.equal(A.catalogo().some(x => x.id === id), false);
});

test("no permite texto repetido", () => {
    const { AlmacenPreguntas: A, base } = nuevo();
    const b01 = base("b01");
    assert.deepEqual([...A.agregar(sinId(b01))], ["Ya existe una pregunta con ese texto."]);
    assert.deepEqual([...A.editar("b02", { ...base("b02"), pregunta: b01.pregunta })], ["Ya existe una pregunta con ese texto."]);
});

test("restaurar se bloquea si el texto choca", () => {
    const { AlmacenPreguntas: A, base } = nuevo();
    const b04 = base("b04");
    A.borrar("b04");
    assert.deepEqual([...A.agregar(sinId(b04))], []);
    const errores = [...A.restaurar("b04")];
    assert.equal(errores.length, 1);
    assert.ok(errores[0].includes("No se puede restaurar"));
    assert.equal(estado(A, "b04"), "borrada");
});

test("ids desconocidos en cambios se ignoran", () => {
    const { AlmacenPreguntas: A } = nuevo({
        cpd_banco_cambios: JSON.stringify({ version: 1, editadas: { zz1: {} }, desactivadas: ["zz2"], borradas: [] })
    });
    assert.equal(A.todas().length, 27);
});

test("catalogo() entrega copias de los datos", () => {
    const { AlmacenPreguntas: A, PREGUNTAS_BASE } = nuevo();
    const original = PREGUNTAS_BASE[0].pregunta;
    A.catalogo()[0].datos.pregunta = "mutada";
    A.catalogo()[0].datos.respuestas.pop();
    assert.equal(PREGUNTAS_BASE[0].pregunta, original);
    assert.equal(A.catalogo()[0].datos.pregunta, original);
});
