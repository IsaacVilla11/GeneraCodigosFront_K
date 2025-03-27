import React, {useState, useEffect, useCallback} from "react";
import {Form, Button, Modal, ToastContainer, Toast} from "react-bootstrap";
import {FaEdit, FaTrash, FaInfo, FaPlus} from "react-icons/fa";
import axios from "axios";
import {API_URL} from "../config";
import {
    generarCodigo,
    generarCodigoAlternativo,
    verificarCodigoExistente
} from "./utils";

const NivelSelector = ({nivel, nivelPadre, onSelect, value}) => {
    const [niveles, setNiveles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [nivelEditar, setNivelEditar] = useState({codigo: "", nombre: ""});
    const [nivelInfo, setNivelInfo] = useState(null);
    const [nombre, setNombre] = useState("");
    const [codigo, setCodigo] = useState("");
    const [codigoValido, setCodigoValido] = useState(true);
    const [codigoEditarValido, setCodigoEditarValido] = useState(true);
    const [nombreModificado, setNombreModificado] = useState(false);
    const [mensaje, setMensaje] = useState({
        mostrar: false, texto: "", tipo: "",
    });


    const cargarNiveles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            let url = `${API_URL}/niveles/padre`;

            if (nivel === 1) {
                // raíz
            } else if (nivel > 1 && nivelPadre) {
                url = `${API_URL}/niveles/padre?nivelPadreId=${nivelPadre}`;
            } else {
                setLoading(false);
                return;
            }

            const response = await axios.get(url);
            setNiveles(response.data);
        } catch (error) {
            setError("Error al cargar niveles. Intente nuevamente.");
            setNiveles([]);
        } finally {
            setLoading(false);
        }
    }, [nivel, nivelPadre, setError, setLoading]); // incluye setError y setLoading si quieres evitar la advertencia


    useEffect(() => {
        cargarNiveles();
    }, [cargarNiveles, nivel, nivelPadre]);


    useEffect(() => {
        if (!nombre.trim()) {
            setCodigo("");
            setCodigoValido(true);
            return;
        }
        generarCodigo(nombre, nivel).then(setCodigo);
    }, [nombre, nivel]);

    useEffect(() => {
        if (!codigo) {
            setCodigoValido(true);
            return;
        }

        const verificarYReemplazar = async () => {
            const existe = await verificarCodigoExistente(codigo);
            if (existe) {
                setCodigoValido(false);
                setTimeout(async () => {
                    const nuevo = await generarCodigoAlternativo(codigo, nombre, nivel);
                    setCodigo(nuevo);
                    setCodigoValido(true);
                }, 1000);
            } else {
                setCodigoValido(true);
            }
        };

        const timeout = setTimeout(verificarYReemplazar, 1000);
        return () => clearTimeout(timeout);
    }, [codigo, nombre, nivel]);

    useEffect(() => {
        if (!nombreModificado || !nivelEditar.codigo) {
            setCodigoEditarValido(true);
            return;
        }

        const timeout = setTimeout(async () => {
            const existe = await verificarCodigoExistente(nivelEditar.codigo);
            if (existe) {
                const nuevoCodigo = await generarCodigoAlternativo(nivelEditar.codigo, nivelEditar.nombre, nivel);
                setNivelEditar((prev) => ({...prev, codigo: nuevoCodigo}));
                setCodigoEditarValido(false);
            } else {
                setCodigoEditarValido(true);
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [nivelEditar.codigo, nivelEditar.nombre, nivel, nombreModificado]);
    const mostrarMensaje = (texto, tipo = "success") => {
        setMensaje({mostrar: true, texto, tipo});
        setTimeout(() => setMensaje({mostrar: false, texto: "", tipo: ""}), 2000);
    };


    const handleChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId === "agregar") {
            setMostrarModal(true);
        } else {
            const selectedNivel = niveles.find((n) => n.id.toString() === selectedId);
            onSelect(selectedNivel ? {id: selectedNivel.id, codigo: selectedNivel.codigo} : null);
        }
    };

    const guardarNuevoNivel = async () => {
        try {
            const nivelData = {
                codigo: codigo.trim(),
                nombre: nombre.trim(),
                nivelPadre: nivelPadre ? {id: Number(nivelPadre)} : null,
            };
            await axios.post(`${API_URL}/niveles`, nivelData);
            setMostrarModal(false);
            setNombre("");
            setCodigo("");
            onSelect(null);
            mostrarMensaje("✅ Nivel creado correctamente.");
            await cargarNiveles();
        } catch (error) {
            mostrarMensaje("❌ Error al guardar el nivel.", "danger");
        }
    };

    const editarNivel = async () => {
        try {
            const nivelData = {
                codigo: typeof nivelEditar.codigo === 'string' ? nivelEditar.codigo.trim() : nivelEditar.codigo?.toString().trim(),
                nombre: nivelEditar.nombre,
                nivelPadre: nivelPadre ? {id: Number(nivelPadre)} : null,
            };
            await axios.put(`${API_URL}/niveles/${value.id}`, nivelData);
            setMostrarModalEditar(false);
            mostrarMensaje("✅ Nivel actualizado correctamente.");
            await cargarNiveles();
        } catch (error) {
            mostrarMensaje("❌ Error al editar el nivel.", "danger");
        }
    };

    const eliminarNivel = async () => {
        try {
            await axios.delete(`${API_URL}/niveles/${value.id}`);
            setMostrarModalEliminar(false);
            onSelect(null);
            mostrarMensaje("🗑️ Nivel eliminado correctamente.");
            await cargarNiveles();
        } catch (error) {
            mostrarMensaje("Error al eliminar el nivel:", error)
        }
    };

    const cargarInfoNivel = async () => {
        try {
            const [infoBasica, infoJerarquia] = await Promise.all([
                axios.get(`${API_URL}/niveles/${value.id}`),
                axios.get(`${API_URL}/niveles/jerarquia/${value.id}`),
            ]);

            setNivelInfo({
                ...infoBasica.data,
                rutaCompleta: infoJerarquia.data.rutaCompleta,
                subniveles: infoJerarquia.data.subniveles,
            });

            setMostrarModalInfo(true);
        } catch (error) {
            mostrarMensaje("Error al cargar información del nivel:", error)
        }
    };

    return (

        <div className="d-flex align-items-center">
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
            <div className="flex-grow-1">

                <Form.Control
                    as="select"
                    onChange={handleChange}
                    value={value?.id || ""}
                    disabled={loading}
                >
                    {loading && (
                        <option disabled>Cargando niveles...</option>
                    )}

                    {error && (
                        <option disabled className="text-danger">{error}</option>
                    )}

                    {!loading && !error && (
                        <>
                            <option value="">Seleccione un nivel</option>
                            {niveles.length > 0 ? (
                                niveles.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.nombre}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No hay niveles disponibles</option>
                            )}
                            {(nivel === 1 || nivelPadre) && (
                                <option value="agregar">+ Agregar subnivel</option>
                            )}
                        </>
                    )}
                </Form.Control>
            </div>

            {value?.id && (
                <div className="d-flex ms-2">
                    <Button
                        variant="outline-success"
                        size="sm"
                        className="me-1"
                        onClick={() => setMostrarModal(true)}
                    >
                        <FaPlus/>
                    </Button>
                    <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-1"
                        onClick={() => {
                            const nivel = niveles.find((n) => n.id === value.id);
                            setNivelEditar({
                                codigo: nivel.codigo?.toString() || "",
                                nombre: nivel.nombre?.toString() || "",
                            });
                            setMostrarModalEditar(true);
                        }}
                    >
                        <FaEdit/>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-1"
                        onClick={() => setMostrarModalEliminar(true)}
                    >
                        <FaTrash/>
                    </Button>
                    <Button variant="outline-info" size="sm" onClick={cargarInfoNivel}>
                        <FaInfo/>
                    </Button>
                </div>
            )}

            {/* Modal para agregar nuevo subnivel */}
            <Modal show={mostrarModal} onHide={() => setMostrarModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Agregar Subnivel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Código</Form.Label>
                            <Form.Control
                                type="text"
                                value={codigo}
                                style={{
                                    borderColor: codigo ? (codigoValido ? "green" : "red") : "#ced4da",
                                    color: codigo ? (codigoValido ? "green" : "red") : "black",
                                    fontWeight: "bold",
                                    backgroundColor: codigo
                                        ? (codigoValido ? "#e6ffe6" : "#ffe6e6")
                                        : "white", // Fondo blanco si no hay código
                                    transition: "0.3s ease-in-out"
                                }}
                                readOnly
                            />
                            {codigo && !codigoValido && (
                                <Form.Text className="text-danger">⚠️ Código duplicado, generando otro...</Form.Text>
                            )}
                            {codigo && codigoValido && (
                                <Form.Text className="text-success">✅ Código válido</Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)} // Genera el código en tiempo real
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={guardarNuevoNivel}
                        disabled={!codigoValido || codigo.trim() === "" || nombre.trim() === ""}
                    >
                        Guardar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal para editar nivel */}
            <Modal show={mostrarModalEditar} onHide={() => {
                setMostrarModalEditar(false);
                setNombreModificado(false);         // Reinicia el seguimiento del cambio
                setCodigoEditarValido(true);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Nivel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Código</Form.Label>
                            <Form.Control
                                type="text"
                                value={nivelEditar.codigo}
                                style={{
                                    borderColor: !nombreModificado ? "blue" : (codigoEditarValido ? "green" : "red"),
                                    color: !nombreModificado ? "blue" : (codigoEditarValido ? "green" : "red"),
                                    fontWeight: "bold",
                                    backgroundColor: nombreModificado
                                        ? (codigoEditarValido ? "#e6ffe6" : "#ffe6e6")
                                        : "#e6f0ff", // Azul si no se ha modificado
                                    transition: "0.3s ease-in-out"
                                }}
                                readOnly
                            />
                            {!nombreModificado && (
                                <Form.Text className="text-primary">ℹ️ Código existente, sin cambios.</Form.Text>
                            )}
                            {nombreModificado && !codigoEditarValido && (
                                <Form.Text className="text-danger">⚠️ Código duplicado, generando otro...</Form.Text>
                            )}
                            {nombreModificado && codigoEditarValido && (
                                <Form.Text className="text-success">✅ Código válido</Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                value={nivelEditar.nombre}
                                onChange={async (e) => {
                                    const nuevoNombre = e.target.value;
                                    const nuevoCodigo = await generarCodigo(nuevoNombre, nivel);

                                    setNombreModificado(true);
                                    setNivelEditar({
                                        ...nivelEditar,
                                        nombre: nuevoNombre,
                                        codigo: nuevoCodigo
                                    });
                                }}

                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setMostrarModalEditar(false);
                        setNombreModificado(false);
                        setCodigoEditarValido(true);
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={editarNivel}
                        disabled={
                            nombreModificado &&
                            (
                                !codigoEditarValido ||
                                typeof nivelEditar.codigo !== 'string' ||
                                nivelEditar.codigo.trim() === "" ||
                                nivelEditar.nombre.trim() === ""
                            )
                        }
                    >
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>


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
                    <Button variant="danger" onClick={eliminarNivel}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal para mostrar información */}
            <Modal show={mostrarModalInfo} onHide={() => setMostrarModalInfo(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Información del Nivel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {nivelInfo && (
                        <>
                            <p>
                                <strong>Código:</strong> {nivelInfo.codigo}
                            </p>
                            <p>
                                <strong>Nombre:</strong> {nivelInfo.nombre}
                            </p>
                            <p>
                                <strong>Nivel Padre:</strong>{" "}
                                {nivelInfo.nivelPadre ? nivelInfo.nivelPadre.nombre : "Raíz"}
                            </p>
                            {/* Sección de Ruta Completa */}
                            <div className="mt-4">
                                <strong>Ruta Completa:</strong>
                                <p className="text-muted">
                                    {nivelInfo.rutaCompleta || "No disponible"}
                                </p>
                            </div>
                            {/* Sección de Subniveles */}
                            {nivelInfo.subniveles && nivelInfo.subniveles.length > 0 && (
                                <div className="mt-4">
                                    <strong>Subniveles:</strong>
                                    <ul className="list-group mt-2">
                                        {nivelInfo.subniveles.map((subnivel) => (
                                            <li key={subnivel.id} className="list-group-item">
                                                <strong>{subnivel.codigo}</strong> - {subnivel.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setMostrarModalInfo(false)}
                    >
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default NivelSelector;
