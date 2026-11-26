const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargar } = require("./cargar");

const { Juego } = cargar(
    ["js/validador.js", "js/modelos.js", "js/preguntas.js", "js/juego.js"], ["Juego"]);

function banco() {
    return ["Uno", "Dos", "Tres", "Cuatro"].map(t => ({
        pregunta: t, categoria: "General", dificultad: "media",
        respuestas: [10, 9, 8, 7, 6].map((p, i) => ({ texto: `${t} r${i}`, puntos: p, alias: [] }))
    }));
}
const textos = j => j.preguntas.map(p => p.texto);

test("ordenFijo respeta el orden", () => {
    const j = new Juego("A", "B", banco(), { rondas: 3, rondaFinal: true, ordenFijo: true }, () => 0);
    assert.deepEqual([...textos(j)], ["Uno", "Dos", "Tres", "Cuatro"]);
});

test("sin ordenFijo baraja", () => {
    const j = new Juego("A", "B", banco(), { rondas: 3, rondaFinal: true }, () => 0);
    assert.notDeepEqual([...textos(j)], ["Uno", "Dos", "Tres", "Cuatro"]);
});
