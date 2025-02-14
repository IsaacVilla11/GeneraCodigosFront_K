import React, { useState, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";

const NivelSelector = ({ nivel, nivelPadre, onSelect, value }) => {
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarNiveles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "http://localhost:8080/api/niveles/padre";

      if (nivel === 1) {
        // ✅ Cargar solo los niveles raíz (niveles sin padre)
        //console.log("📡 Cargando niveles raíz...");
      } else if (nivel > 1 && nivelPadre) {
        // ✅ Solo cargar los subniveles del nivel seleccionado
        url = `http://localhost:8080/api/niveles/padre?nivelPadreId=${nivelPadre}`;
        //console.log("📡 Cargando subniveles desde: ", url);
      } else {
        //console.log(
          //"⚠️ No hay un nivel padre seleccionado. No se cargan datos."
        //);
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
  }, [nivel, nivelPadre]); // ✅ Agregamos las dependencias necesarias

  /** 🔹 useEffect corregido */
  useEffect(() => {
    cargarNiveles();
  }, [cargarNiveles]); // ✅ Solo depende de `cargarNiveles`

  /** 🔹 Función para manejar cambios en el selector */
  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedNivel = niveles.find((n) => n.id.toString() === selectedId);
    onSelect(
      selectedNivel
        ? { id: selectedNivel.id, codigo: selectedNivel.codigo }
        : null
    );
  };

  /** 🔹 Evita carga innecesaria en niveles superiores sin padre */
  if (nivel > 1 && (!nivelPadre || nivelPadre === "")) {
    return (
      <Form.Control as="select" disabled>
        <option>Seleccione el nivel anterior primero</option>
      </Form.Control>
    );
  }

  /** 🔹 Mensajes de carga y error */
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

  /** 🔹 Renderización del selector */
  return (
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
    </Form.Control>
  );
};

export default NivelSelector;
