import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import axios from "axios";

const NivelSelector = ({ nivel, nivelPadre, onSelect, value }) => {
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNivel, setNuevoNivel] = useState({ codigo: "", nombre: "" });

  const cargarNiveles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = "http://localhost:8080/api/niveles/padre";

      if (nivel === 1) {
        // Cargar niveles raíz
      } else if (nivel > 1 && nivelPadre) {
        // Cargar subniveles del nivel padre seleccionado
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
      cargarNiveles();
    } catch (error) {
      console.error("❌ Error al guardar nivel:", error);
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
    <>
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
    </>
  );
};

export default NivelSelector;
