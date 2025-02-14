import React, { useState, useCallback, useEffect } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import { FaEdit, FaTrash, FaInfo } from "react-icons/fa";
import axios from "axios";

const NivelSelector = ({ nivel, nivelPadre, onSelect, value }) => {
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [nuevoNivel, setNuevoNivel] = useState({ codigo: "", nombre: "" });
  const [nivelEditar, setNivelEditar] = useState({ codigo: "", nombre: "" });
  const [nivelInfo, setNivelInfo] = useState(null);

  const cargarNiveles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = "http://localhost:8080/api/niveles/padre";

      if (nivel === 1) {
        // Cargar niveles raíz
      } else if (nivel > 1 && nivelPadre) {
        url = `http://localhost:8080/api/niveles/padre?nivelPadreId=${nivelPadre}`;
      } else {
        setLoading(false);
        return;
      }

      const response = await axios.get(url);
      setNiveles(response.data);
    } catch (error) {
      console.error("❌ Error al cargar niveles:", error);
      setError("Error al cargar niveles. Intente nuevamente.");
      setNiveles([]);
    } finally {
      setLoading(false);
    }
  }, [nivel, nivelPadre]);

  useEffect(() => {
    cargarNiveles();
  }, [cargarNiveles]);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "agregar") {
      setMostrarModal(true);
    } else {
      const selectedNivel = niveles.find((n) => n.id.toString() === selectedId);
      onSelect(
        selectedNivel
          ? { id: selectedNivel.id, codigo: selectedNivel.codigo }
          : null
      );
    }
  };

  const guardarNuevoNivel = async () => {
    try {
      const nivelData = {
        codigo: nuevoNivel.codigo,
        nombre: nuevoNivel.nombre,
        nivelPadre: nivelPadre ? { id: Number(nivelPadre) } : null,
      };
      await axios.post("http://localhost:8080/api/niveles", nivelData);
      setMostrarModal(false);
      setNuevoNivel({ codigo: "", nombre: "" });
      cargarNiveles();
    } catch (error) {
      console.error("❌ Error al guardar nivel:", error);
    }
  };

  const editarNivel = async () => {
    try {
      const nivelData = {
        codigo: nivelEditar.codigo,
        nombre: nivelEditar.nombre,
        nivelPadre: nivelPadre ? { id: Number(nivelPadre) } : null,
      };
      await axios.put(
        `http://localhost:8080/api/niveles/${value.id}`,
        nivelData
      );
      setMostrarModalEditar(false);
      cargarNiveles();
    } catch (error) {
      console.error("❌ Error al editar nivel:", error);
    }
  };

  const eliminarNivel = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/niveles/${value.id}`);
      setMostrarModalEliminar(false);
      onSelect(null);
      cargarNiveles();
    } catch (error) {
      console.error("❌ Error al eliminar nivel:", error);
    }
  };

  const cargarInfoNivel = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/niveles/jerarquia/${value.id}`
      );
      setNivelInfo(response.data);
      setMostrarModalInfo(true);
    } catch (error) {
      console.error("❌ Error al cargar información del nivel:", error);
    }
  };

  if (loading) {
    return (
      <Form.Control as="select" disabled>
        <option>Cargando niveles...</option>
      </Form.Control>
    );
  }

  if (error) {
    return (
      <Form.Control as="select" disabled>
        <option>{error}</option>
      </Form.Control>
    );
  }

  return (
    <div className="d-flex align-items-center">
      <Form.Control as="select" onChange={handleChange} value={value?.id || ""}>
        <option value="">Seleccione un nivel</option>
        {niveles.length > 0 ? (
          niveles.map((n) => (
            <option key={n.id} value={n.id}>
              {n.codigo} - {n.nombre}
            </option>
          ))
        ) : (
          <option disabled>No hay niveles disponibles</option>
        )}
        <option value="agregar">+ Agregar subnivel</option>
      </Form.Control>

      {value?.id && (
        <div className="ms-2">
          <Button
            variant="outline-primary"
            size="sm"
            className="me-1"
            onClick={() => {
              const nivel = niveles.find((n) => n.id === value.id);
              setNivelEditar({
                codigo: nivel.codigo,
                nombre: nivel.nombre,
              });
              setMostrarModalEditar(true);
            }}
          >
            <FaEdit />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="me-1"
            onClick={() => setMostrarModalEliminar(true)}
          >
            <FaTrash />
          </Button>
          <Button variant="outline-info" size="sm" onClick={cargarInfoNivel}>
            <FaInfo />
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
                value={nuevoNivel.codigo}
                onChange={(e) =>
                  setNuevoNivel({ ...nuevoNivel, codigo: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={nuevoNivel.nombre}
                onChange={(e) =>
                  setNuevoNivel({ ...nuevoNivel, nombre: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={guardarNuevoNivel}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar nivel */}
      <Modal
        show={mostrarModalEditar}
        onHide={() => setMostrarModalEditar(false)}
      >
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
                onChange={(e) =>
                  setNivelEditar({ ...nivelEditar, codigo: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={nivelEditar.nombre}
                onChange={(e) =>
                  setNivelEditar({ ...nivelEditar, nombre: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setMostrarModalEditar(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={editarNivel}>
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
                <strong>Ruta Completa:</strong> {nivelInfo.rutaCompleta}
              </p>
              {nivelInfo.subniveles && nivelInfo.subniveles.length > 0 && (
                <>
                  <p>
                    <strong>Subniveles:</strong>
                  </p>
                  <ul>
                    {nivelInfo.subniveles.map((subnivel) => (
                      <li key={subnivel.id}>
                        {subnivel.codigo} - {subnivel.nombre}
                      </li>
                    ))}
                  </ul>
                </>
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
