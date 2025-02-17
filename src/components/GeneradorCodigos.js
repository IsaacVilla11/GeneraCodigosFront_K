import React, { useState, useEffect } from "react";
import NivelSelector from "./NivelSelector";
import { Button, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import { FaCopy, FaCog } from "react-icons/fa";
import { API_URL } from "../config";

const GeneradorCodigos = ({ abrirCrud }) => {
  const [niveles, setNiveles] = useState([]);
  const [totalNiveles, setTotalNiveles] = useState(6);

  useEffect(() => {
    obtenerCantidadNiveles();
  }, []);

  const obtenerCantidadNiveles = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/niveles/cantidadMaxima`
      );
      const cantidadNiveles = Math.max(6, response.data + 1);
      setTotalNiveles(cantidadNiveles);
      setNiveles(Array(cantidadNiveles).fill({ id: "", codigo: "" }));
    } catch (error) {
      //console.error("❌ Error al obtener la cantidad de niveles:", error);
    }
  };

  const manejarSeleccion = (index, nivelSeleccionado) => {
    let nuevosNiveles = [...niveles];
    nuevosNiveles[index] = nivelSeleccionado || { id: "", codigo: "" };

    for (let i = index + 1; i < nuevosNiveles.length; i++) {
      nuevosNiveles[i] = { id: "", codigo: "" };
    }

    setNiveles(nuevosNiveles);
  };

  const copiarCodigo = () => {
    const codigo = niveles
      .filter((nivel) => nivel && nivel.codigo)
      .map((nivel) => nivel.codigo)
      .join("");

    navigator.clipboard
      .writeText(codigo)
      //.then(() => alert("✅ Código copiado al portapapeles"))
      .catch((err) => console.error("❌ Error al copiar:", err));
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Card
        className="shadow-lg p-4"
        style={{ maxWidth: "750px", width: "100%" }}
      >
        {/* Título y botón de gestión alineado a la izquierda */}
        <Row className="align-items-center mb-4">
          <Col xs={6} className="text-start">
            <h3 className="text-success fw-bold">
              Generador de Códigos
            </h3>
          </Col>
          <Col xs={6} className="text-end">
            <Button variant="primary" onClick={abrirCrud}>
              <FaCog className="me-2" /> Gestionar Niveles
            </Button>
          </Col>
        </Row>

        {/* Niveles alineados a la izquierda */}
        <Row className="justify-content-let">
          <Col xs={12}>
            {Array.from({ length: totalNiveles }, (_, i) => (
              <Row key={i} className="mb-2 align-items-center">
                <Col xs={3} className="fw-semibold text-success text-end pe-2">
                  Nivel {i + 1}:
                </Col>
                <Col xs={9}>
                  <NivelSelector
                    nivel={i + 1}
                    nivelPadre={i > 0 ? niveles[i - 1]?.id || "" : null}
                    onSelect={(valor) => manejarSeleccion(i, valor)}
                    value={niveles[i]}
                  />
                </Col>
              </Row>
            ))}
          </Col>
        </Row>

        {/* Código generado y botón de copiar alineado a la izquierda */}
        <Row className="mt-4 align-items-left">
          <Col xs={8} className="text-start">
            <Card
              className="p-3 bg-light shadow-sm text-center"
              style={{ maxWidth: "400px", minHeight: "50px" }}
            >
              <h5 className="mb-0 text-dark text-truncate">
                {niveles
                  .filter((n) => n.codigo)
                  .map((n) => n.codigo)
                  .join("") || "Código generado aquí"}
              </h5>
            </Card>
          </Col>
          <Col xs={4} className="text-start">
            <Button
              variant="secondary"
              onClick={copiarCodigo}
              style={{ padding: "10px 20px" }}
            >
              <FaCopy className="me-2" /> Copiar
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default GeneradorCodigos;
