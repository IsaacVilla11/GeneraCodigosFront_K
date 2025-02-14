import React, { useState } from "react";
import NivelSelector from "./NivelSelector";
import { Button, Container, Row, Col, Form, Card } from "react-bootstrap";

const GeneradorCodigos = ({ abrirCrud }) => {
  const [niveles, setNiveles] = useState(Array(6).fill({ id: "", codigo: "" }));

  const manejarSeleccion = (index, nivelSeleccionado) => {
    let nuevosNiveles = [...niveles];

    // ✅ Verifica si `nivelSeleccionado` es `null` y asigna un objeto vacío
    nuevosNiveles[index] = nivelSeleccionado || { id: "", codigo: "" };

    // ✅ Limpiar niveles siguientes para evitar valores incorrectos
    for (let i = index + 1; i < niveles.length; i++) {
      nuevosNiveles[i] = { id: "", codigo: "" };
    }

    setNiveles(nuevosNiveles);
  };

  const generarCodigo = () => {
    const codigo = niveles
      .filter((nivel) => nivel && nivel.codigo) // ✅ Verifica que `nivel` no sea null
      .map((nivel) => nivel.codigo)
      .join("");

    // Opcionalmente puedes mostrar un alert o hacer algo con el código generado
    console.log(
      "Código generado:",
      codigo || "Ningún código seleccionado aún."
    );
  };

  const copiarCodigo = () => {
    const codigo = niveles
      .filter((nivel) => nivel && nivel.codigo)
      .map((nivel) => nivel.codigo)
      .join("");

    navigator.clipboard
      .writeText(codigo)
      .then(() => alert("Código copiado al portapapeles"))
      .catch((err) => console.error("Error al copiar:", err));
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h1 className="text-success">Generador de códigos</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={abrirCrud}>
            Gestionar Niveles
          </Button>
        </Col>
      </Row>

      {Array.from({ length: 6 }, (_, i) => (
        <Form.Group key={i} className="mb-2">
          <Form.Label className="text-success">Nivel {i + 1}:</Form.Label>
          <NivelSelector
            nivel={i + 1}
            nivelPadre={i > 0 ? niveles[i - 1]?.id || "" : null} // ✅ Evita acceder a `niveles[-1]`
            onSelect={(valor) => manejarSeleccion(i, valor)}
            value={niveles[i]}
          />
        </Form.Group>
      ))}

      <Button className="mt-3" variant="dark" onClick={generarCodigo}>
        Generar Código
      </Button>

      <Card className="mt-3 p-3 bg-light">
        <h4>
          {niveles
            .filter((n) => n.codigo)
            .map((n) => n.codigo)
            .join("") || "Código generado aparecerá aquí"}
        </h4>
      </Card>

      <Button className="mt-2" variant="secondary" onClick={copiarCodigo}>
        Copiar
      </Button>
    </Container>
  );
};

export default GeneradorCodigos;
