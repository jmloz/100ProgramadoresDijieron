const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const ARCHIVOS = ["js/validador.js", "js/modelos.js", "js/preguntas.js", "js/pantalla.js", "js/almacen.js"];
const NOMBRES = ["AlmacenPreguntas", "AlmacenConfig", "AlmacenPantalla", "Preparacion", "PREGUNTAS_BASE", "PANTALLA_POR_DEFECTO"];
function nuevo(almacen = {}) {
    return { ...cargar(ARCHIVOS, NOMBRES, { almacen }), almacen };
}
const json = x => JSON.parse(JSON.stringify(x));
const nueva = texto => ({
    pregunta: texto, categoria: "Prueba", dificultad: "media",
    respuestas: [["Uno", 30], ["Dos", 25], ["Tres", 20], ["Cuatro", 15], ["Cinco", 10]]
        .map(([texto, puntos]) => ({ texto, puntos }))
});

test("exportar e importar ida y vuelta", () => {
    const A = nuevo();
    const b01 = json(A.PREGUNTAS_BASE.find(p => p.id === "b01"));
    assert.deepEqual([...A.AlmacenPreguntas.editar("b01", { ...b01, pregunta: "Pregunta editada" })], []);
    A.AlmacenPreguntas.desactivar("b02");
    assert.deepEqual([...A.AlmacenPreguntas.agregar(nueva("Mi pregunta propia"))], []);
    A.AlmacenPantalla.guardar({ ...json(A.PANTALLA_POR_DEFECTO), lema: { mostrar: false, texto: "x" } });
    A.AlmacenConfig.guardar({ ...A.AlmacenConfig.POR_DEFECTO, nombres: ["X", "Y"], rondas: 4 });

    const datos = json(A.Preparacion.exportar());
    assert.equal(datos.tipo, "100pd-preparacion");
    assert.equal(datos.version, 1);
    assert.equal(typeof datos.exportadoEn, "string");
    assert.ok(!("nombres" in datos.config));

    const B = nuevo();
    B.AlmacenConfig.guardar({ ...B.AlmacenConfig.POR_DEFECTO, nombres: ["P", "Q"] });
    const r = B.Preparacion.importar(JSON.parse(JSON.stringify(datos)));
    assert.equal(r.preguntasIgnoradas, 0);
    assert.deepEqual(json(B.AlmacenPreguntas.catalogo()), json(A.AlmacenPreguntas.catalogo()));
    assert.deepEqual(json(B.AlmacenPantalla.cargar().lema), { mostrar: false, texto: "x" });
    const cfg = B.AlmacenConfig.cargar();
    assert.deepEqual(json(cfg.nombres), ["P", "Q"]);
    assert.equal(cfg.rondas, 4);
});

test("formato viejo suma", () => {
    const A = nuevo();
    const r = A.Preparacion.importar([nueva("Pregunta del formato viejo")]);
    assert.equal(r.preguntasIgnoradas, 0);
    assert.equal(A.AlmacenPreguntas.todas().length, 28);
});

test("archivo ajeno lanza", () => {
    const A = nuevo();
    assert.throws(() => A.Preparacion.importar({ hola: 1 }),
        { message: "El archivo no es una preparación de 100 Programadores Dijeron." });
});

test("datos dañados se ignoran", () => {
    const A = nuevo();
    const r = A.Preparacion.importar({
        tipo: "100pd-preparacion", version: 1,
        personalizadas: [{ pregunta: "mala" }, nueva("Valida sin id")],
        cambios: { editadas: { zz: {} } },
        config: { categorias: ["NoExiste"] },
        pantalla: "basura"
    });
    assert.equal(r.preguntasIgnoradas, 1);
    assert.equal(A.AlmacenPreguntas.todas().length, 28);
    assert.equal(A.AlmacenConfig.cargar().categorias, null);
    assert.deepEqual(json(A.AlmacenPantalla.cargar()), json(A.PANTALLA_POR_DEFECTO));
    assert.deepEqual(json(A.AlmacenPreguntas._cambios().editadas), {});
});

test("ids de importación masiva son únicos", () => {
    const A = nuevo();
    const ids = new Set();
    for (let i = 0; i < 500; i++) ids.add(A.AlmacenPreguntas._idNuevo());
    assert.equal(ids.size, 500);
});

test("cargar() no comparte listaFija con POR_DEFECTO", () => {
    const A = nuevo();
    A.AlmacenConfig.cargar().listaFija.push("b01");
    assert.deepEqual(json(A.AlmacenConfig.cargar().listaFija), []);
});
