import React, {useState, useEffect} from "react";
import NivelSelector from "./NivelSelector";
import {Button, Row, Col, Card} from "react-bootstrap";
import axios from "axios";
import {FaCopy, FaCog, FaSpinner} from "react-icons/fa";
import {API_URL} from "../config";

const GeneradorCodigos = ({abrirCrud}) => {
    const [niveles, setNiveles] = useState([]);
    const [totalNiveles, setTotalNiveles] = useState(6);
    const [resaltar, setResaltar] = useState(false); // Estado para controlar el resaltado

    useEffect(() => {
        obtenerCantidadNiveles();
    }, []);

    const obtenerCantidadNiveles = async () => {
        try {
            const response = await axios.get(`${API_URL}/niveles/cantidadMaxima`);
            const cantidadNiveles = Math.max(6, response.data + 1);
            setTotalNiveles(cantidadNiveles);
            setNiveles(Array(cantidadNiveles).fill({id: "", codigo: ""}));
        } catch (error) {
            //console.error(" Error al obtener la cantidad de niveles:", error);
        }
    };

    const manejarSeleccion = (index, nivelSeleccionado) => {
        let nuevosNiveles = [...niveles];
        nuevosNiveles[index] = nivelSeleccionado || {id: "", codigo: ""};

        for (let i = index + 1; i < nuevosNiveles.length; i++) {
            nuevosNiveles[i] = {id: "", codigo: ""};
        }

        setNiveles(nuevosNiveles);
    };

    const copiarCodigo = () => {
        const codigo = niveles
            .filter((nivel) => nivel && nivel.codigo)
            .map(
                (nivel) => nivel.codigo.split("*")[0]
            ) /* el codigo generado ignora todo despues del * */
            .join("");

        navigator.clipboard.writeText(codigo);
        setResaltar(true);
        setTimeout(() => setResaltar(false), 500); // Resaltar por 1 segundo
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Card
                className="shadow-lg p-4"
                style={{
                    maxWidth: "800px",
                    minWidth: "50%",
                    width: "90%",
                    minHeight: "60%",//500PX
                    maxHeight: "90%",
                    margin: "0 auto",
                    overflowY: "auto"
                }}
            >
                {/* Título y botón de gestión */}
                <Row className="align-items-center mb-4">
                    <Col xs={6} className="text-lg-start">
                        <h3 className="text-success fw-bold"><FaSpinner className="me-2"/> Generador de Códigos</h3>

                    </Col>
                    <Col xs={6} className="text-end">
                        <Button variant="outline-primary" onClick={abrirCrud}>
                            <FaCog className="me-2"/> Gestionar Niveles
                        </Button>
                    </Col>
                </Row>

                {/* Niveles */}
                <Row className="justify-content-center">
                    <Col xs={12}>
                        {Array.from({length: totalNiveles}, (_, i) => (
                            <Row key={i} className="mb-2 align-items-center">
                                <Col xs={12} md={2} className="fw-semibold text-success text-md-end">
                                    Nivel {i + 1}:
                                </Col>
                                <Col xs={12} md={10}>
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
                    <Col xs={9} className="text-start">
                        <Card
                            className="p-3 bg-light shadow-sm text-center overflow-auto"
                            style={{
                                maxWidth: "100%",
                                minHeight: "10%",
                                border: resaltar ? "2px solid rgba(0, 0, 0, 0.3)" : "2px solid rgba(0, 0, 0, 0.1)",
                                transition: "border 0.3s ease"
                            }}

                        >
                            <h5 className="mb-0 text-dark text-center">
                                {niveles
                                    .filter((n) => n.codigo)
                                    .map(
                                        (n) => n.codigo.split("*")[0]
                                    ) /* el codigo generado ignora todo despues del * */
                                    .join("") || "Código generado aquí"}
                            </h5>
                        </Card>
                    </Col>
                    <Col xs={3} className="text-start">
                        <Button
                            variant="outline-primary"
                            onClick={copiarCodigo}
                            style={{padding: "10px 20px"}}
                        >
                            <FaCopy className="me-2"/> Copiar
                        </Button>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default GeneradorCodigos;//
