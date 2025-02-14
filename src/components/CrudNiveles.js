import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Table,
  Modal,
  Form,
  Navbar,
  Container,
  Row,
  Col,
} from "react-bootstrap";

const CrudNiveles = ({ cerrarCrud }) => {
  const [niveles, setNiveles] = useState([]);
  const [nivelesFiltrados, setNivelesFiltrados] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState("");
  const [nivelSeleccionado, setNivelSeleccionado] = useState(null);
  const [nivelFiltro, setNivelFiltro] = useState(null); // Estado para filtrar por nivel
  const [nivelPadreActual, setNivelPadreActual] = useState(null); // Guarda el nivel anterior

  const [nuevoNivel, setNuevoNivel] = useState({
    codigo: "",
    nombre: "",
    nivelPadreId: "",
  });
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarNiveles();
  }, []);

  useEffect(() => {
    let filtrados = niveles;

    if (nivelFiltro !== null) {
      filtrados = niveles.filter(
        (n) => n.nivelPadre && n.nivelPadre.id === nivelFiltro
      );
    }

    if (busqueda) {
      filtrados = filtrados.filter(
        (n) =>
          (n.codigo &&
            n.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
          (n.nombre && n.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    setNivelesFiltrados(filtrados);
  }, [busqueda, niveles, nivelFiltro]);

  const cargarNiveles = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/niveles");

      // 📌 Verificar datos recibidos antes de procesarlos
      //console.log("📌 Datos recibidos en el frontend:", response.data);

      // Cargar padres si solo llega el ID en vez del objeto
      const nivelesConPadre = await Promise.all(
        response.data.map(async (nivel) => {
          if (nivel.nivelPadre && typeof nivel.nivelPadre === "number") {
            try {
              const padreResponse = await axios.get(
                `http://localhost:8080/api/niveles/${nivel.nivelPadre}`
              );
              return { ...nivel, nivelPadre: padreResponse.data };
            } catch (error) {
              console.error("❌ Error al obtener nivel padre:", error);
              return { ...nivel, nivelPadre: null };
            }
          }
          return nivel;
        })
      );

      setNiveles(nivelesConPadre);
    } catch (error) {
      console.error("❌ Error al cargar niveles:", error);
    }
  };

  const abrirModal = async (modo, nivel = null) => {
    setModo(modo);

    if (modo === "Crear") {
      setNuevoNivel({ codigo: "", nombre: "", nivelPadreId: "" }); // ✅ Se asegura de que los campos estén vacíos
    } else if (modo === "CrearSubnivel" && nivel) {
      setNuevoNivel({ codigo: "", nombre: "", nivelPadreId: nivel.id });
    } else if (modo === "Modificar" && nivel) {
      setNuevoNivel({
        id: nivel.id,
        codigo: nivel.codigo,
        nombre: nivel.nombre,
        nivelPadreId: nivel.nivelPadre ? nivel.nivelPadre.id : "",
      });
    } else if (modo === "Ver" && nivel) {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/niveles/jerarquia/${nivel.id}`
        );
        setNivelSeleccionado({
          ...nivel,
          jerarquia: response.data.subniveles || [],
          rutaCompleta: response.data.rutaCompleta || "No disponible",
        });
      } catch (error) {
        console.error("❌ Error al obtener jerarquía:", error);
        setNivelSeleccionado(nivel);
      }
    }

    setMostrarModal(true);
  };

  const guardarNivel = async () => {
    const nivelData = {
      codigo: nuevoNivel.codigo,
      nombre: nuevoNivel.nombre,
      nivelPadre: nuevoNivel.nivelPadreId
        ? { id: Number(nuevoNivel.nivelPadreId) }
        : null,
    };

    //console.log("📤 Enviando datos al backend:", nivelData);

    try {
      if (modo === "Crear" || modo === "CrearSubnivel") {
        await axios.post("http://localhost:8080/api/niveles", nivelData);
        alert("✅ Nivel creado con éxito.");
      } else {
        await axios.put(
          `http://localhost:8080/api/niveles/${nuevoNivel.id}`,
          nivelData
        );
        alert("✅ Nivel actualizado con éxito.");
      }
      cargarNiveles();
      setMostrarModal(false);
    } catch (error) {
      console.error("❌ Error al guardar nivel:", error);
      alert("❌ Error al guardar nivel.");
    }
  };

  const eliminarNivel = async (id) => {
    const confirmacion = window.confirm(
      "¿Estás seguro de que deseas eliminar este nivel?"
    );
    if (!confirmacion) return;

    try {
      await axios.delete(`http://localhost:8080/api/niveles/${id}`);
      alert("✅ Nivel eliminado con éxito.");
      cargarNiveles();
    } catch (error) {
      console.error("❌ Error al eliminar nivel:", error);
      alert("❌ No se pudo eliminar el nivel.");
    }
  };
  const filtrarPorNivel = (nivel) => {
    setNivelFiltro(nivel.id);
    setNivelPadreActual(nivel.nivelPadre ? nivel.nivelPadre.id : null);
  };

  return (
    <Container className="mt-4">
      {/* Menú Superior */}
      <Navbar bg="light" expand="lg" className="p-3 mb-3 rounded shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">
            Gestión de Niveles
          </Navbar.Brand>
          <Form.Control
            type="text"
            placeholder="Buscar por código o nombre..."
            className="w-50"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Button variant="outline-dark" onClick={cerrarCrud}>
            Regresar al Inicio
          </Button>
        </Container>
      </Navbar>

      {/* Botón Crear Nivel */}
      <Row className="mb-3">
        <Col>
          <Button
            variant="success"
            className="shadow-sm"
            onClick={() => abrirModal("Crear")}
          >
            + Crear Nivel
          </Button>
        </Col>
      </Row>

      {/* Tabla de Niveles */}
      <Row className="mb-3">
        <Col>
          {nivelFiltro !== null && (
            <>
              {nivelPadreActual !== null && (
                <Button
                  className="me-2"
                  variant="secondary"
                  onClick={() => setNivelFiltro(nivelPadreActual)}
                >
                  Volver al Nivel Anterior
                </Button>
              )}
              <Button variant="secondary" onClick={() => setNivelFiltro(null)}>
                Mostrar Todos
              </Button>
            </>
          )}
        </Col>
      </Row>

      <Table
        striped
        bordered
        hover
        responsive
        className="mt-3 shadow-sm rounded"
      >
        <thead className="bg-light text-dark">
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Nivel Padre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {nivelesFiltrados.map((nivel) => (
            <tr
              key={nivel.id}
              onClick={() => filtrarPorNivel(nivel)}
              style={{ cursor: "po  inter" }}
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
                  Ver
                </Button>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirModal("Modificar", nivel);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarNivel(nivel.id);
                  }}
                >
                  Eliminar
                </Button>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirModal("CrearSubnivel", nivel);
                  }}
                >
                  + Subnivel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modo} Nivel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modo === "Ver" && nivelSeleccionado ? (
            <div>
              <p>
                <strong>Código:</strong> {nivelSeleccionado.codigo}
              </p>
              <p>
                <strong>Nombre:</strong> {nivelSeleccionado.nombre}
              </p>
              <p>
                <strong>Nivel Padre:</strong>{" "}
                {nivelSeleccionado.nivelPadre
                  ? nivelSeleccionado.nivelPadre.nombre
                  : "Raíz"}
              </p>
              <p>
                <strong>Ruta Completa:</strong>{" "}
                {nivelSeleccionado.rutaCompleta || "No disponible"}
              </p>
            </div>
          ) : (
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
              <Form.Group>
                <Form.Label>Nivel Padre</Form.Label>
                <Form.Select
                  value={nuevoNivel.nivelPadreId || ""}
                  onChange={(e) =>
                    setNuevoNivel({
                      ...nuevoNivel,
                      nivelPadreId: e.target.value,
                    })
                  }
                >
                  <option value="">Raíz</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarModal(false)}>
            Cerrar
          </Button>
          {modo !== "Ver" && (
            <Button variant="success" onClick={guardarNivel}>
              Guardar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CrudNiveles;
