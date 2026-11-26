/*
 * ============================================================
 *  PANTALLA "BANCO DE PREGUNTAS" (panel del moderador)
 *  Lista todo el catálogo (base + propias), con búsqueda y filtros,
 *  y permite crear, editar, duplicar, desactivar, borrar y restaurar.
 * ============================================================
 */

const Banco = {
    /** null = formulario cerrado; {modo:"agregar"} o {modo:"editar", id} */
    edicion: null,

    iniciar() {
        $("filas-respuestas").addEventListener("input", () => this.actualizarSuma());
        $("form-banco").addEventListener("submit", ev => { ev.preventDefault(); this.guardar(); });
        $("btn-nueva-pregunta").addEventListener("click", () => this.abrirFormulario({ modo: "agregar" }));
        $("btn-cancelar-banco").addEventListener("click", () => this.cerrarFormulario());
        $("btn-mas-respuesta").addEventListener("click", () => {
            if ($("filas-respuestas").children.length < MAX_RESPUESTAS) {
                this.agregarFila();
                this.actualizarFilas();
            }
        });
        $("banco-buscar").addEventListener("input", () => this.dibujarLista());
        ["banco-f-categoria", "banco-f-dificultad", "banco-f-estado"].forEach(id =>
            $(id).addEventListener("change", () => this.dibujarLista()));
    },

    abrir() {
        this.cerrarFormulario();
        this.llenarCategorias();
        this.dibujarLista();
        irA("banco");
    },

    /* ---------- Lista ---------- */

    llenarCategorias() {
        const cats = AlmacenPreguntas.categorias();
        $("categorias-existentes").replaceChildren(...cats.map(c => el("option", { value: c })));
        const sel = $("banco-f-categoria");
        const actual = sel.value;
        sel.replaceChildren(
            el("option", { value: "", texto: "Todas las categorías" }),
            ...cats.map(c => el("option", { value: c, texto: c })));
        sel.value = cats.includes(actual) ? actual : "";
    },

    cumpleFiltros(x) {
        const estadoF = $("banco-f-estado").value;
        if (estadoF === "borradas") { if (x.estado !== "borrada") return false; }
        else if (x.estado === "borrada") return false;
        if (estadoF === "originales" && x.origen !== "base") return false;
        if (estadoF === "editadas" && !x.editada) return false;
        if (estadoF === "tuyas" && x.origen !== "personalizada") return false;
        if (estadoF === "desactivadas" && x.estado !== "desactivada") return false;

        const cat = $("banco-f-categoria").value;
        if (cat && AlmacenPreguntas.categoriaDe(x.datos) !== cat) return false;
        const dif = $("banco-f-dificultad").value;
        if (dif && (x.datos.dificultad || "media") !== dif) return false;

        const q = Validador.normalizar($("banco-buscar").value);
        if (q) {
            const textos = [x.datos.pregunta, ...(x.datos.respuestas || []).map(r => r.texto)];
            if (!textos.some(t => Validador.normalizar(String(t || "")).includes(q))) return false;
        }
        return true;
    },

    dibujarLista() {
        const todo = AlmacenPreguntas.catalogo();
        const total = todo.filter(x => x.estado !== "borrada").length;
        const activas = todo.filter(x => x.estado === "activa").length;
        $("banco-conteo").textContent = `${activas} activas de ${total}`;

        const visibles = todo.filter(x => this.cumpleFiltros(x));
        $("banco-lista").replaceChildren(...(visibles.length
            ? visibles.map(x => this.fila(x))
            : [el("li", { clase: "nota", texto: "No hay preguntas con esos filtros." })]));
    },

    etiquetaEstado(x) {
        if (x.estado === "borrada") return { texto: "Borrada", mala: true };
        if (x.estado === "desactivada") return { texto: "Desactivada", mala: true };
        if (x.editada) return { texto: "Editada" };
        if (x.origen === "personalizada") return { texto: "Tuya" };
        return null;
    },

    fila(x) {
        const d = x.datos;
        const et = this.etiquetaEstado(x);
        const titulo = el("span", { texto: d.pregunta });
        if (et) titulo.append(el("span", { clase: `etiqueta-estado${et.mala ? " mala" : ""}`, texto: et.texto }));

        const botones = [];
        const btn = (texto, accion, clase = "") =>
            botones.push(el("button", { type: "button", clase: `btn btn-mini ${clase}`.trim(), texto, onclick: accion }));
        if (x.estado === "borrada") {
            btn("Restaurar original", () => this.restaurar(x.id));
        } else {
            btn("Editar", () => this.abrirFormulario({ modo: "editar", id: x.id }, d));
            btn("Duplicar", () => this.abrirFormulario({ modo: "agregar" }, { ...d, pregunta: `${d.pregunta} (copia)` }));
            if (x.estado === "desactivada") btn("Activar", () => this.cambiar(() => AlmacenPreguntas.activar(x.id)));
            else btn("Desactivar", () => this.cambiar(() => AlmacenPreguntas.desactivar(x.id)));
            if (x.origen === "base" && x.editada) btn("Restaurar original", () => this.restaurar(x.id));
            btn("Borrar", () => this.confirmarBorrado(x), "btn-error");
        }

        return el("li", { clase: x.estado === "activa" ? "" : "inactiva" },
            el("div", { clase: "banco-texto" },
                titulo,
                el("span", {
                    clase: "banco-meta",
                    texto: `${AlmacenPreguntas.categoriaDe(d)} · ${DIFICULTADES[d.dificultad || "media"]} · ` +
                        `${(d.respuestas || []).length} respuestas`
                })),
            el("div", { clase: "banco-acciones" }, ...botones));
    },

    cambiar(accion) {
        // Si la pregunta que se está editando cambia de estado desde la lista, el formulario quedaría obsoleto
        const ed = this.edicion && this.edicion.modo === "editar" ? this.edicion.id : null;
        const huella = () => {
            const x = ed && AlmacenPreguntas.catalogo().find(q => q.id === ed);
            return x ? `${x.estado}|${x.editada}` : "";
        };
        const antes = huella();
        accion();
        if (ed && huella() !== antes) this.cerrarFormulario();
        $("ok-banco").textContent = "";
        this.llenarCategorias();
        this.dibujarLista();
        actualizarConteo();
    },

    confirmarBorrado(x) {
        const base = x.origen === "base";
        Modal.abrir("Borrar pregunta",
            `¿Borrar «${x.datos.pregunta}»? ` + (base ? "Podrás restaurarla después." : "No se puede deshacer."),
            [
                { texto: "Borrar", clase: "btn-error", accion: () => this.cambiar(() => AlmacenPreguntas.borrar(x.id)) },
                { texto: "Cancelar", clase: "btn-secundario" }
            ]);
    },

    restaurar(id) {
        const errores = AlmacenPreguntas.restaurar(id);
        if (errores.length) {
            Modal.abrir("No se pudo restaurar", errores.join(" "), [{ texto: "Aceptar" }]);
            return;
        }
        this.cambiar(() => {});
    },

    /* ---------- Formulario ---------- */

    agregarFila(r = {}) {
        $("filas-respuestas").append(el("div", { clase: "fila-respuesta" },
            el("span", { clase: "num" }),
            el("input", { clase: "r-texto", maxlength: "50", placeholder: "Respuesta", value: r.texto || "" }),
            el("input", {
                clase: "r-puntos", type: "number", min: "1", max: "100", step: "1", placeholder: "pts",
                value: r.puntos != null ? String(r.puntos) : ""
            }),
            el("input", {
                clase: "r-alias", maxlength: "200", placeholder: "sinónimo1, sinónimo2",
                value: (r.alias || []).join(", ")
            }),
            el("button", {
                type: "button", clase: "btn btn-mini btn-error", texto: "✕", title: "Quitar respuesta",
                onclick: ev => {
                    if ($("filas-respuestas").children.length > MIN_RESPUESTAS) {
                        ev.target.closest(".fila-respuesta").remove();
                        this.actualizarFilas();
                    }
                }
            })
        ));
    },

    /** Renumera y habilita/deshabilita los botones según el mínimo y máximo. */
    actualizarFilas() {
        const filas = [...$("filas-respuestas").children];
        filas.forEach((f, i) => {
            f.querySelector(".num").textContent = String(i + 1);
            f.querySelector("button").disabled = filas.length <= MIN_RESPUESTAS;
        });
        $("btn-mas-respuesta").disabled = filas.length >= MAX_RESPUESTAS;
        this.actualizarSuma();
    },

    abrirFormulario(edicion, datos = null) {
        this.edicion = edicion;
        $("titulo-form-banco").textContent = edicion.modo === "editar" ? "Editar pregunta" : "Nueva pregunta";
        $("banco-pregunta").value = datos ? datos.pregunta : "";
        $("banco-categoria").value = datos && datos.categoria ? datos.categoria : "";
        $("banco-dificultad").value = (datos && datos.dificultad) || "media";
        const respuestas = datos ? datos.respuestas : [];
        $("filas-respuestas").replaceChildren();
        const n = Math.min(MAX_RESPUESTAS, Math.max(MIN_RESPUESTAS, respuestas.length));
        for (let i = 0; i < n; i++) this.agregarFila(respuestas[i]);
        const cantidad = (typeof UI !== "undefined" && UI.config && UI.config.respuestas) || RESPUESTAS_POR_RONDA;
        $("nota-tablero").textContent = `En el tablero salen las ${cantidad} con más puntos.`;
        $("error-banco").textContent = "";
        this.actualizarFilas();
        $("form-banco").hidden = false;
        $("banco-pregunta").focus();
        $("form-banco").scrollIntoView({ block: "start" });
    },

    cerrarFormulario() {
        this.edicion = null;
        $("form-banco").hidden = true;
    },

    leerFormulario() {
        const respuestas = [];
        document.querySelectorAll("#filas-respuestas .fila-respuesta").forEach(fila => {
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
            categoria: $("banco-categoria").value.trim() || CATEGORIA_POR_DEFECTO,
            dificultad: $("banco-dificultad").value,
            pregunta: $("banco-pregunta").value.trim(),
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
        if (!this.edicion) return;
        const datos = this.leerFormulario();
        const errores = this.edicion.modo === "editar"
            ? AlmacenPreguntas.editar(this.edicion.id, datos)
            : AlmacenPreguntas.agregar(datos);
        if (errores.length) {
            $("error-banco").textContent = errores.join(" ");
            return;
        }
        this.cerrarFormulario();
        this.cambiar(() => {});
        $("ok-banco").textContent = "✔ Pregunta guardada.";
    }
};
