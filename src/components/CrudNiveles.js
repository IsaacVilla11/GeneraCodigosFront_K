import React, {useState, useEffect, useCallback} from "react";
import axios from "axios";
import {Card, Toast, ToastContainer} from "react-bootstrap";
import {
    FaBackward, FaBorderAll, FaEdit, FaHome, FaInfo, FaPlus, FaSortAmountDown, FaStream, FaTrash,
} from "react-icons/fa";
import {API_URL} from "../config";
import {
    Button, Table, Modal, Form, Container, Row, Col, Pagination,
} from "react-bootstrap";
import {
    generarCodigo,
    verificarCodigoExistente,
    generarCodigoAlternativo
} from "./utils";

const CrudNiveles = ({cerrarCrud}) => {
    const [niveles, setNiveles] = useState([]);
    const [nivelesFiltrados, setNivelesFiltrados] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modo, setModo] = useState("");
    const [nivelSeleccionado, setNivelSeleccionado] = useState(null);
    const [nivelFiltro, setNivelFiltro] = useState(null);
    const [nivelPadreActual, setNivelPadreActual] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [elementosPorPagina] = useState(6);
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [nivelAEliminar, setNivelAEliminar] = useState(null);
    const [nivelUbicado, setNivelUbicado] = useState(null);
    const [codigoEditarValido, setCodigoEditarValido] = useState(true);
    const [textoPendiente, setTextoPendiente] = useState("");
    const [codigoJerarquia, setCodigoJerarquia] = useState("");
    const [codigoGeneradoVisible, setCodigoGeneradoVisible] = useState(false);
    const [copiado, setCopiado] = useState(false);

    const [nuevoNivel, setNuevoNivel] = useState({
        codigo: "", nombre: "", nivelPadreId: "",
    });
    const [busqueda, setBusqueda] = useState("");
    const [mensaje, setMensaje] = useState({
        mostrar: false, texto: "", tipo: "",
    });

    // Calcular índices para la paginación
    const indiceUltimoElemento = paginaActual * elementosPorPagina;
    const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
    const elementosPaginaActual = nivelesFiltrados
        .slice(indicePrimerElemento, indiceUltimoElemento);

    // Cambiar de página
    const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

    useEffect(() => {
        void cargarNiveles();
    }, []);
    const [nombreModificado, setNombreModificado] = useState(false);


    const obtenerNivelActual = useCallback(() => {
        if (!nuevoNivel.nivelPadreId) return 1;
        const padre = niveles.find((n) => n.id === Number(nuevoNivel.nivelPadreId));
        if (!padre) return 2;

        let nivel = 2;
        let actual = padre;
        while (actual.nivelPadre) {
            nivel++;
            // eslint-disable-next-line no-loop-func
            actual = niveles.find((n) => n.id === actual.nivelPadre.id);
        }
        return nivel;
    }, [niveles, nuevoNivel.nivelPadreId]);
    useEffect(() => {
        if (modo !== "Crear" && modo !== "CrearSubnivel") return;
        if (!nuevoNivel.codigo || !nuevoNivel.nombre) return;

        const verificarDuplicado = async () => {
            const existe = await verificarCodigoExistente(nuevoNivel.codigo);

            if (existe) {
                const nuevoCodigo = await generarCodigoAlternativo(
                    nuevoNivel.codigo,
                    nuevoNivel.nombre,
                    obtenerNivelActual()
                );
                setNuevoNivel((prev) => ({...prev, codigo: nuevoCodigo}));
            } else {
                //console.log("✅ [Crear] Código disponible.");
            }
        };

        const timeout = setTimeout(verificarDuplicado, 1000);
        return () => clearTimeout(timeout);
    }, [nuevoNivel.codigo, nuevoNivel.nombre, modo, obtenerNivelActual]);

    useEffect(() => {
        if (modo !== "Modificar") return; // SOLO se ejecuta en modo edición
        if (!nombreModificado || !nuevoNivel.codigo || !nuevoNivel.nombre) return;
        if (!nuevoNivel.nombre.trim()) {
            setNuevoNivel(prev => ({...prev, codigo: ""}));
            return;
        }

        const timeout = setTimeout(async () => {
            const existe = await verificarCodigoExistente(nuevoNivel.codigo);
            //console.log("📦 Existe:", existe);

            if (existe) {
                //console.log("Código duplicado. Generando alternativo...");
                const nuevoCodigo = await generarCodigoAlternativo(
                    nuevoNivel.codigo,
                    nuevoNivel.nombre,
                    obtenerNivelActual()
                );

                if (nuevoCodigo !== nuevoNivel.codigo) {
                    //console.log("🔁 Código alternativo generado:", nuevoCodigo);
                    setNuevoNivel((prev) => ({...prev, codigo: nuevoCodigo}));

                    const existeNuevo = await verificarCodigoExistente(nuevoCodigo);
                    //console.log("Existe nuevo:", existeNuevo);
                    setCodigoEditarValido(!existeNuevo);
                } else {
                    //console.log("No se pudo generar un nuevo código alternativo.");
                    setCodigoEditarValido(false);
                }
            } else {
                //console.log("✅ Código disponible.");
                setCodigoEditarValido(true);
            }
        }, 2000);

        return () => clearTimeout(timeout);
    }, [modo, nombreModificado, nuevoNivel.codigo, nuevoNivel.nombre, obtenerNivelActual]);

    useEffect(() => {
        if (modo !== "Crear" && modo !== "CrearSubnivel") return;
        // Si el campo nombre está vacío, limpiar el código
        if (!nuevoNivel.nombre.trim()) {
            setNuevoNivel((prev) => ({...prev, codigo: ""}));
            return;
        }
        if (!textoPendiente.trim()) return;

        const timeout = setTimeout(async () => {
            const nivel = obtenerNivelActual();
            const codigoBase = await generarCodigo(textoPendiente, nivel);

            if (codigoBase.length < (nivel === 1 ? 3 : nivel <= 4 ? 2 : 1)) {
                console.warn("[Crear] Código base muy corto, esperando más texto...");
                return;
            }

            const existe = await verificarCodigoExistente(codigoBase);
            console.log("[Crear] Existe:", existe);

            if (!existe) {
                setNuevoNivel(prev => ({...prev, codigo: codigoBase}));
            } else {
                const codigoUnico = await generarCodigoAlternativo(codigoBase, textoPendiente, nivel);

                const existeAlternativo = await verificarCodigoExistente(codigoUnico);

                if (!existeAlternativo) {
                    //console.log("✅ [Crear] Código alternativo disponible.");
                    setNuevoNivel(prev => ({...prev, codigo: codigoUnico}));
                } else {
                    //console.warn("❌ [Crear] No se pudo generar código único válido.");
                }
            }
        }, 1000); //

        return () => clearTimeout(timeout);
    }, [textoPendiente, modo, nuevoNivel.nombre, obtenerNivelActual]);


    const mostrarMensaje = (texto, tipo = "success") => {
        setMensaje({mostrar: true, texto, tipo});
        setTimeout(() => setMensaje({mostrar: false, texto: "", tipo: ""}), 2000);
    };
    const ubicarseEnNivel = (nivel) => {
        // Reiniciar la búsqueda
        setBusqueda("");

        // Establecer el nivel filtrado como el nivel "ubicado"
        setNivelFiltro(nivel.id);
        setNivelPadreActual(nivel.nivelPadre ? nivel.nivelPadre.id : null);

        // Limpiar el nivel "ubicado"
        setNivelUbicado(null);
    };

    const cargarNiveles = async () => {
        try {
            const response = await axios.get(`${API_URL}/niveles`);
            const nivelesConPadre = await Promise.all(response.data.map(async (nivel) => {
                if (nivel.nivelPadre && typeof nivel.nivelPadre === "number") {
                    try {
                        const padreResponse = await axios.get(`${API_URL}/niveles/${nivel.nivelPadre}`);
                        return {...nivel, nivelPadre: padreResponse.data};
                    } catch (error) {
                        //console.error(" Error al obtener nivel padre:", error);
                        return {...nivel, nivelPadre: null};
                    }
                }
                return nivel;
            }));
            //console.log("Niveles cargados:", nivelesConPadre);
            setNiveles(nivelesConPadre);
        } catch (error) {
            console.error(" Error al cargar niveles:", error);
        }
    };
    useEffect(() => {
        let filtrados = niveles;

        // 1. Aplicar filtro de jerarquía PRIMERO
        if (nivelFiltro !== null) {
            filtrados = niveles.filter(n => n.nivelPadre?.id === nivelFiltro);
        } else if (!busqueda) {
            // Si no hay filtro de nivel ni búsqueda, mostrar niveles raíz
            filtrados = filtrados.filter(n => !n.nivelPadre);
        }

        //Eliminacion de caracteres especiales para la busqueda correcta
        const normalizeText = (texto) =>
            texto?.toLowerCase()
                .normalize("NFD")         // Descompone letras con tilde (e.g. á -> a +  ́)
                .replace(/[\u0300-\u036f]/g, "") // Quita los diacríticos
                .replace(/[^a-z0-9\s]/gi, "");  // Opcional: elimina caracteres especiales si deseas

        const normalizedBusqueda = normalizeText(busqueda);

        // 2. Aplicar búsqueda SOBRE los resultados de la jerarquía
        filtrados = filtrados.filter(n =>
            normalizeText(n.codigo).includes(normalizedBusqueda) ||
            normalizeText(n.nombre).includes(normalizedBusqueda)
        );

        setNivelesFiltrados(filtrados);
        setPaginaActual(1);
    }, [busqueda, niveles, nivelFiltro]);

    const abrirModal = async (modo, nivel = null) => {
        setModo(modo);

        if (modo === "Crear") {
            setNuevoNivel({codigo: "", nombre: "", nivelPadreId: ""});
            setNombreModificado(false); // 💡 importante para que no active lógica de modificación
        } else if (modo === "CrearSubnivel" && nivel) {
            setNuevoNivel({codigo: "", nombre: "", nivelPadreId: nivel.id});
        } else if (modo === "Modificar" && nivel) {
            setNuevoNivel({
                id: nivel.id,
                codigo: nivel.codigo,
                nombre: nivel.nombre,
                nivelPadreId: nivel.nivelPadre ? nivel.nivelPadre.id : "",
            });
            setNombreModificado(false);
        } else if (modo === "Ver" && nivel) {
            try {
                const response = await axios.get(`${API_URL}/niveles/jerarquia/${nivel.id}`);
                setNivelSeleccionado({
                    ...nivel,
                    jerarquia: response.data.subniveles || [],
                    rutaCompleta: response.data.rutaCompleta || "No disponible",
                });
            } catch (error) {
                //console.error("Error al obtener jerarquía:", error);
                setNivelSeleccionado(nivel);
            }
        }

        setMostrarModal(true);
    };

    const guardarNivel = async () => {
        const nivelData = {
            codigo: nuevoNivel.codigo,
            nombre: nuevoNivel.nombre,
            nivelPadre: nuevoNivel.nivelPadreId ? {id: Number(nuevoNivel.nivelPadreId)} : null,
        };

        try {
            if (modo === "Crear" || modo === "CrearSubnivel") {
                await axios.post(`${API_URL}/niveles`, nivelData);
                mostrarMensaje("✅ Nivel creado con éxito.");
            } else {
                await axios.put(`${API_URL}/niveles/${nuevoNivel.id}`, nivelData);
                mostrarMensaje("✅ Nivel actualizado con éxito.");
            }
            await cargarNiveles();
            setMostrarModal(false);
        } catch (error) {
            mostrarMensaje("❌ Error al guardar nivel.", "danger");
        }
    };

    const eliminarNivel = (id) => {
        setNivelAEliminar(id); // Almacena el ID del nivel a eliminar
        setMostrarModalEliminar(true); // Abre el modal de confirmación
    };

    const confirmarEliminacion = async () => {
        if (!nivelAEliminar) return; // Si no hay un nivel a eliminar, no hacer nada

        try {
            await axios.delete(`${API_URL}/niveles/${nivelAEliminar}`);
            mostrarMensaje("✅ Nivel eliminado con éxito.");
            await cargarNiveles(); // Recargar la lista de niveles
        } catch (error) {
            mostrarMensaje("❌ No se pudo eliminar el nivel.", "danger");
        } finally {
            setMostrarModalEliminar(false); // Cerrar el modal
            setNivelAEliminar(null); // Limpiar el nivel a eliminar
        }
    };

    const filtrarPorNivel = (nivel) => {
        if (nivelFiltro === nivel.id) return;

        setNivelFiltro(nivel.id);
        setNivelPadreActual(nivel.nivelPadre?.id || null);
        setNivelUbicado(nivel); // Almacenar para el botón "Ubicarse aquí"
    };

    const volverAlNivelAnterior = () => {
        if (nivelPadreActual !== null) {
            setNivelFiltro(nivelPadreActual); // Filtra por el nivel padre
            const nivelPadre = niveles.find((n) => n.id === nivelPadreActual);
            setNivelPadreActual(nivelPadre?.nivelPadre?.id || null); // Actualiza el nivel padre actual
        } else {
            setNivelFiltro(null); // Si no hay nivel padre, vuelve a la raíz
        }
    };

    const mostrarTodos = () => {
        setNivelFiltro(null); // Restablece el filtro para mostrar todos los niveles raíz
        setNivelPadreActual(null); // Restablece el nivel padre actual
        setBusqueda(""); // Desactiva la búsqueda
    };
    const renderCodigoHelperText = () => {
        if (modo !== "Modificar") return null;

        if (!nombreModificado)
            return <Form.Text className="text-primary">ℹ️ Código original sin cambios.</Form.Text>;

        if (!codigoEditarValido)
            return <Form.Text className="text-danger">⚠️ Código duplicado, generando otro...</Form.Text>;

        return <Form.Text className="text-success">✅ Código válido</Form.Text>;
    };
    const generarCodigoJerarquiaS = () => {
        if (!nivelSeleccionado || !nivelSeleccionado.rutaCompleta) return "";

        const nombresRuta = nivelSeleccionado.rutaCompleta
            .split("/")
            .map(n => n.trim());

        const codigos = nombresRuta
            .map(nombre => {
                const nivel = niveles.find(n => n.nombre.trim().toLowerCase() === nombre.toLowerCase());
                let codigo = nivel?.codigo || "";

                // 🟡 Aplicar regla: si tiene '*', cortar hasta el '*'
                if (codigo.includes("*")) {
                    codigo = codigo.split("*")[0];
                }

                return codigo;
            })
            .filter(Boolean);

        return codigos.join("");
    };
    const copiarCodigo = () => {
        navigator.clipboard.writeText(codigoJerarquia).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1000); // efecto por 1 segundo
        });
    };


    return (<Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className="shadow-lg p-4"
              style={{width: "100vw", height: "90%", overflowY: "auto"}}>
            {/* Toast para mensajes */}
            <ToastContainer position="top-end" className="p-3">
                <Toast
                    bg={mensaje.tipo}
                    show={mensaje.mostrar}
                    onClose={() => setMensaje({mostrar: false})}
                    delay={4000}
                    autohide
                >
                    <Toast.Body className={`text-white`}>{mensaje.texto}</Toast.Body>
                </Toast>
            </ToastContainer>

            {/* Título y Botón de Cerrar */}
            <Row className="align-items-center mb-4">
                <Col xs={6} className="text-start">
                    <h3 className="text-primary fw-bold">
                        <FaStream size="20px" className="me-2"/> Gestión de Niveles
                    </h3>
                </Col>
                <Col xs={6} className="text-end">
                    <Button variant="outline-primary" onClick={cerrarCrud}>
                        <FaHome size="20px" className="me-2"/> Inicio
                    </Button>
                </Col>
            </Row>

            {/* Barra de búsqueda y Botón Crear Nivel */}
            {nivelFiltro === null && (
                <>
                    <Row className="mb-2 justify-content-between">
                        <Col xs="auto">
                            <Button
                                variant="success"
                                className="shadow-sm"
                                onClick={() => abrirModal("Crear")}
                            >
                                <FaPlus/> Crear 1 Nivel
                            </Button>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            <div className="alert alert-info mb-0 py-2 px-3">
                                Lista de 1 nivel.
                            </div>
                        </Col>
                    </Row>
                </>
            )}

            {/* Botones de Filtrado */}
            <Row className="mb-3">
                <Col>
                    {nivelFiltro !== null && (<>
                        {nivelPadreActual !== null && (<Button
                            className="me-2"
                            variant="secondary"
                            onClick={volverAlNivelAnterior} // Botón para volver al nivel anterior
                        >
                            <FaBackward className="me-2"/> Volver al nivel anterior
                        </Button>)}
                        <Button variant="secondary" onClick={mostrarTodos}> {/* Botón para mostrar todos */}
                            <FaBorderAll className="me-2"/> Mostrar Todos
                        </Button>
                        {nivelUbicado && busqueda && (<Button
                            variant="info"
                            className="ms-2"
                            onClick={() => ubicarseEnNivel(nivelUbicado)}
                        >
                            <FaSortAmountDown className="me-2"/> Ubicarse en este nivel
                        </Button>)}
                    </>)}
                </Col>
            </Row>
            <Row className="mb-3 justify-content-between">
                <Col xs={6}>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        className="w-100"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </Col>
            </Row>

            {/* Tabla de Niveles */}
            <Table
                striped
                bordered
                hover
                responsive
                className="mt-3 rounded-3"
            >
                <thead className="bg-light text-dark">
                <tr>
                    <th>Código</th>
                    <th>Nombre del nivel</th>
                    <th>Nivel Padre</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {elementosPaginaActual.map((nivel) => (<tr
                    key={nivel.id}
                    onClick={() => filtrarPorNivel(nivel)}
                    style={{cursor: "pointer"}}
                >
                    <td>{nivel.codigo}</td>
                    <td>{nivel.nombre}</td>
                    <td>{nivel.nivelPadre ? nivel.nivelPadre.nombre : "Raíz"}</td>
                    <td>
                        <Button
                            variant="info"
                            className="me-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                abrirModal("Ver", nivel);
                            }}
                        >
                            <FaInfo/>
                        </Button>
                        <Button
                            variant="warning"
                            className="me-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                abrirModal("Modificar", nivel);
                            }}
                        >
                            <FaEdit/>
                        </Button>
                        <Button
                            variant="danger"
                            className="me-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                eliminarNivel(nivel.id);
                            }}
                        >
                            <FaTrash/>
                        </Button>
                        <Button
                            variant="primary"
                            className="me-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                abrirModal("CrearSubnivel", nivel);
                            }}
                        >
                            <FaPlus/> Subnivel
                        </Button>
                    </td>
                </tr>))}
                </tbody>
            </Table>
            {/* Modal de confirmación para eliminar */}
            <Modal
                show={mostrarModalEliminar}
                onHide={() => setMostrarModalEliminar(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Está seguro de que desea eliminar este nivel? Esta acción no se puede
                    deshacer.
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setMostrarModalEliminar(false)}
                    >
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmarEliminacion}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Paginación */}
            <Pagination className="justify-content-center mt-4">
                {paginaActual > 1 && (
                    <Pagination.Prev onClick={() => cambiarPagina(paginaActual - 1)}/>
                )}

                {paginaActual > 3 && (
                    <Pagination.Item onClick={() => cambiarPagina(1)}>
                        1
                    </Pagination.Item>
                )}

                {paginaActual > 4 && <Pagination.Ellipsis/>}

                {[...Array(Math.ceil(nivelesFiltrados.length / elementosPorPagina)).keys()].map((numero) => {
                    const numeroPagina = numero + 1;
                    if (
                        numeroPagina >= paginaActual - 2 &&
                        numeroPagina <= paginaActual + 2
                    ) {
                        return (
                            <Pagination.Item
                                key={numeroPagina}
                                active={numeroPagina === paginaActual}
                                onClick={() => cambiarPagina(numeroPagina)}
                            >
                                {numeroPagina}
                            </Pagination.Item>
                        );
                    }
                    return null;
                })}

                {paginaActual < Math.ceil(nivelesFiltrados.length / elementosPorPagina) - 3 && (
                    <Pagination.Ellipsis/>
                )}

                {paginaActual < Math.ceil(nivelesFiltrados.length / elementosPorPagina) && (
                    <Pagination.Next onClick={() => cambiarPagina(paginaActual + 1)}/>
                )}
            </Pagination>

            {/* Modal */}
            <Modal show={mostrarModal} onHide={() => {
                setMostrarModal(false);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{modo} Nivel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modo === "Ver" && nivelSeleccionado ? (
                            <div>
                                <p><strong>Código:</strong> {nivelSeleccionado.codigo}</p>
                                <p><strong>Nombre:</strong> {nivelSeleccionado.nombre}</p>
                                <p><strong>Nivel
                                    Padre:</strong> {nivelSeleccionado.nivelPadre ? nivelSeleccionado.nivelPadre.nombre : "Raíz"}
                                </p>
                                <p><strong>Ruta Completa:</strong> {nivelSeleccionado.rutaCompleta || "No disponible"}</p>

                                {/* Botón para generar código jerárquico */}
                                <div className="mt-3">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => {
                                            const codigoGenerado = generarCodigoJerarquiaS();
                                            setCodigoJerarquia(codigoGenerado);
                                            setCodigoGeneradoVisible(true);
                                        }}
                                    >
                                        Generar Código
                                    </Button>

                                    {codigoGeneradoVisible && (
                                        <div className="mt-3">
                                            <Form.Group>
                                                <Form.Label>Código Generado</Form.Label>
                                                <div className="d-flex">
                                                    <Form.Control
                                                        type="text"
                                                        value={codigoJerarquia}
                                                        readOnly
                                                        className="me-2"
                                                    />
                                                    <Button
                                                        variant={copiado ? "outline-primary" : "outline-secondary"}
                                                        onClick={copiarCodigo}
                                                    >
                                                        {copiado ? "Copiado" : "Copiar"}
                                                    </Button>
                                                </div>
                                            </Form.Group>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                        : (<Form>
                            <Form.Group className="mb-3">
                                <Form.Label column={true}>Código</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={nuevoNivel.codigo}
                                    readOnly
                                    style={{
                                        borderColor: !nombreModificado ? "blue" : (codigoEditarValido ? "green" : "red"),
                                        backgroundColor: nombreModificado
                                            ? (codigoEditarValido ? "#e6ffe6" : "#ffe6e6")
                                            : "#e6f0ff",
                                        color: !nombreModificado ? "blue" : (codigoEditarValido ? "green" : "red"),
                                        fontWeight: "bold",
                                        transition: "0.3s ease"
                                    }}

                                />
                                {renderCodigoHelperText()}

                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label column={true}>Nombre</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={nuevoNivel.nombre}
                                    onChange={(e) => {
                                        const nuevoNombre = e.target.value;
                                        //console.log(`Nombre actualizado: "${nuevoNombre}" | Modo: ${modo}`);
                                        if (modo === "Modificar") setNombreModificado(true);

                                        setNuevoNivel(prev => ({...prev, nombre: nuevoNombre}));
                                        setTextoPendiente(nuevoNombre); // solo se guarda para luego
                                    }}
                                />

                            </Form.Group>
                            <Form.Group>
                                <Form.Label column={true}>Nivel Padre</Form.Label>
                                <Form.Select
                                    value={nuevoNivel.nivelPadreId || ""}
                                    onChange={(e) => setNuevoNivel({
                                        ...nuevoNivel, nivelPadreId: e.target.value,
                                    })} disabled
                                >
                                    <option value="">Raíz</option>
                                    {niveles.map((n) => (<option key={n.id} value={n.id}>
                                        {n.nombre}
                                    </option>))}
                                </Form.Select>
                            </Form.Group>
                        </Form>)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setMostrarModal(false);
                        setCodigoJerarquia("");
                        setCodigoGeneradoVisible(false);
                    }}>
                        Cerrar
                    </Button>
                    {modo !== "Ver" && (
                        <Button
                            variant="success"
                            onClick={guardarNivel}
                            disabled={
                                (modo === "Modificar" && !nombreModificado) ||
                                !nuevoNivel.nombre.trim() ||
                                !nuevoNivel.codigo.trim() ||
                                (nombreModificado && !codigoEditarValido)
                            }
                        >
                            Guardar
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Card>
    </Container>);
};

export default CrudNiveles;