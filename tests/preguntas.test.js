const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

test("cada pregunta base tiene un id único bNN", () => {
    const { PREGUNTAS_BASE } = cargar(["js/preguntas.js"], ["PREGUNTAS_BASE"]);
    const ids = PREGUNTAS_BASE.map(p => p.id);
    for (const id of ids) assert.match(id, /^b\d{2}$/);
    assert.equal(new Set(ids).size, PREGUNTAS_BASE.length);
});

test("todas las preguntas base son válidas y suman 100", () => {
    const { Pregunta, PREGUNTAS_BASE } = cargar(
        ["js/validador.js", "js/modelos.js", "js/preguntas.js"],
        ["Pregunta", "PREGUNTAS_BASE"]
    );
    for (const p of PREGUNTAS_BASE) {
        assert.deepEqual([...Pregunta.validarDatos(p)], []);
    }
    const suma = PREGUNTAS_BASE.reduce(
        (total, p) => total + p.respuestas.reduce((s, r) => s + r.puntos, 0), 0
    );
    assert.equal(suma, PREGUNTAS_BASE.length * 100);
});
