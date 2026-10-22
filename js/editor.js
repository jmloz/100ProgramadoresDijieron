/*
 * ============================================================
 *  PANTALLA "AGREGAR PREGUNTA" (panel del moderador)
 * ============================================================
 */
const Editor = {
    iniciar() {
        const filas = $("filas-respuestas");
        for (let i = 1; i <= MAX_RESPUESTAS; i++) {
            const opcional = i > MIN_RESPUESTAS;
            filas.append(el("div", { clase: "fila-respuesta" },
                el("span", { clase: "num", texto: String(i) }),
                el("input", { clase: "r-texto", maxlength: "50", placeholder: opcional ? "(opcional)" : "Respuesta" }),
                el("input", { clase: "r-puntos", type: "number", min: "1", max: "100", step: "1", placeholder: "pts" }),
                el("input", { clase: "r-alias", maxlength: "200", placeholder: "sinónimo1, sinónimo2" })
            ));
        }
        filas.addEventListener("input", () => this.actualizarSuma());
        $("form-agregar").addEventListener("submit", ev => { ev.preventDefault(); this.guardar(); });
        $("btn-exportar").addEventListener("click", () => this.exportar());
        $("input-importar").addEventListener("change", ev => this.importar(ev.target));
    },

    abrir() {
        $("error-agregar").textContent = "";
        $("ok-agregar").textContent = "";
        $("categorias-existentes").replaceChildren(
            ...AlmacenPreguntas.categorias().map(c => el("option", { value: c })));
        this.dibujarLista();
        irA("agregar");
        $("nueva-pregunta").focus();
    },

    leerFormulario() {
        const respuestas = [];
        document.querySelectorAll(".fila-respuesta").forEach(fila => {
            const texto = fila.querySelector(".r-texto").value.trim();
            const puntosTxt = fila.querySelector(".r-puntos").value.trim();
            if (!texto && !puntosTxt) return; // fila vacía
            respuestas.push({
                texto,
                puntos: Number(puntosTxt),
                alias: fila.querySelector(".r-alias").value.split(",").map(a => a.trim()).filter(Boolean)
            });
        });
        return {
            categoria: $("nueva-categoria").value.trim() || CATEGORIA_POR_DEFECTO,
            dificultad: $("nueva-dificultad").value,
            pregunta: $("nueva-pregunta").value.trim(),
            respuestas
        };
    },

    actualizarSuma() {
        const suma = this.leerFormulario().respuestas.reduce((s, r) => s + (Number.isFinite(r.puntos) ? r.puntos : 0), 0);
        const nodo = $("suma-puntos");
        nodo.textContent = suma;
        nodo.classList.toggle("excedido", suma > MAX_PUNTOS_PREGUNTA);
    },

    guardar() {
        $("ok-agregar").textContent = "";
        const datos = this.leerFormulario();
        const errores = AlmacenPreguntas.agregar(datos);
        if (errores.length) {
            $("error-agregar").textContent = errores.join(" ");
            return;
        }
        $("error-agregar").textContent = "";
        $("ok-agregar").textContent = "✔ Pregunta guardada. Ya puede salir en las siguientes partidas.";
        $("form-agregar").reset();
        this.actualizarSuma();
        this.dibujarLista();
        actualizarConteo();
    },

    dibujarLista() {
        const lista = AlmacenPreguntas.personalizadas();
        const ul = $("lista-personalizadas");
        if (!lista.length) {
            ul.replaceChildren(el("li", { clase: "nota", texto: "Aún no has agregado preguntas." }));
            return;
        }
        ul.replaceChildren(...lista.map((p, i) => el("li", {},
            el("span", {
                texto: `${p.pregunta} · ${AlmacenPreguntas.categoriaDe(p)} · ` +
                    `${DIFICULTADES[p.dificultad || "media"]} (${(p.respuestas || []).length} respuestas)`
            }),
            el("button", {
                clase: "btn btn-mini btn-error", texto: "Eliminar",
                onclick: () => Modal.abrir("Eliminar pregunta", `¿Eliminar «${p.pregunta}»?`, [
                    { texto: "Eliminar", clase: "btn-error", accion: () => { AlmacenPreguntas.eliminar(i); this.dibujarLista(); actualizarConteo(); } },
                    { texto: "Cancelar", clase: "btn-secundario" }
                ])
            })
        )));
    },

    exportar() {
        const lista = AlmacenPreguntas.personalizadas();
        if (!lista.length) {
            $("error-agregar").textContent = "No hay preguntas personalizadas para exportar.";
            return;
        }
        const blob = new Blob([JSON.stringify(lista, null, 4)], { type: "application/json" });
        const a = el("a", { href: URL.createObjectURL(blob), download: "preguntas-personalizadas.json" });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    importar(input) {
        const archivo = input.files && input.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
            try {
                const { agregadas, rechazadas } = AlmacenPreguntas.importar(JSON.parse(lector.result));
                $("error-agregar").textContent = rechazadas ? `${rechazadas} pregunta(s) inválidas o repetidas no se importaron.` : "";
                $("ok-agregar").textContent = `✔ ${agregadas} pregunta(s) importadas.`;
            } catch (e) {
                $("error-agregar").textContent = `No se pudo importar: ${e.message}`;
            }
            input.value = "";
            this.dibujarLista();
            actualizarConteo();
        };
        lector.readAsText(archivo);
    }
};
