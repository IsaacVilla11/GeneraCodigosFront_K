import axios from "axios";
import { API_URL } from "../config";

const limpiarPalabras = (nombre) => {
    const conectores = ["de", "del", "la", "las", "el", "los", "y", "para", "con", "a", "en"];
    return nombre
        .trim()
        .split(/\s+/)
        .filter(p => !conectores.includes(p.toLowerCase()));
};

const reglaPesosMedidas = async (nombre) => {
    const texto = nombre.trim().toLowerCase();
    const unidades = ["kg", "t", "g", "lb", "oz", "µg", "mg", "m", "cm", "al", "an", "l"];

    if (/^\d/.test(texto)) {
        const match = texto.match(/^(\d+)([a-z]{1,3})/i);
        if (match) {
            const [, cantidad, unidad] = match;
            const unidadNormalizada = unidad.toLowerCase();
            if (unidades.includes(unidadNormalizada)) {
                let base = `${cantidad}${unidadNormalizada}`.toUpperCase();
                let sufijo = 1;
                let codigo = base;

                while (await verificarCodigoExistente(codigo)) {
                    sufijo++;
                    codigo = `${base}${sufijo}`;
                }

                //console.log("Código por medida/peso único:", codigo);
                return codigo;
            }
        }
    }

    return null;
};

const codigoRegla1 = async (nombre) => {
    const palabras = limpiarPalabras(nombre);
    let base;

    if (palabras.length === 1) {
        base = palabras[0].toUpperCase().substring(0, 3);
    } else if (palabras.length === 2) {
        const primera = palabras[0].charAt(0).toUpperCase();
        const segunda = palabras[1].substring(0, 2).toUpperCase();
        base = (primera + segunda).substring(0, 3);
    } else {
        base = palabras.slice(0, 3).map(p => p.charAt(0).toUpperCase()).join("");
    }


    const letras = base.split("");
    const intentos = new Set();

    for (let i = 0; i < letras.length; i++) {
        for (let j = 0; j < letras.length; j++) {
            for (let k = 0; k < letras.length; k++) {
                const comb = `${letras[i]}${letras[j]}${letras[k]}`;
                if (!intentos.has(comb)) {
                    intentos.add(comb);
                    const existe = await verificarCodigoExistente(comb);
                    //console.log(` Existe "${comb}":`, existe);
                    if (!existe) return comb;
                }
            }
        }
    }

    //console.warn(" No se pudo generar código único de 3 letras para nivel 1.");
    return base;
};

const codigoRegla2a4 = async (nombre) => {
    const letras = nombre
        .toUpperCase()
        .replace(/\s+/g, "")
        .split("");

    const intentos = new Set();
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < letras.length; i++) {
        for (let j = 0; j < letras.length; j++) {
            const comb = `${letras[i]}${letras[j]}`;
            if (!intentos.has(comb)) {
                intentos.add(comb);
                console.log(`🔄 Intento 2L: Validando código "${comb}"`);
                const existe = await verificarCodigoExistente(comb);
                console.log(`📦 Existe "${comb}":`, existe);
                if (!existe) return comb;
            }
        }
    }

    const unicas = new Set(letras);
    const externas = alfabeto.split("").filter(c => !unicas.has(c));

    for (let extra of externas) {
        for (let base of letras) {
            const comb1 = `${base}${extra}`;
            const comb2 = `${extra}${base}`;
            for (let comb of [comb1, comb2]) {
                if (!intentos.has(comb)) {
                    intentos.add(comb);
                    //console.log(`🔄 Intento extra: Validando código "${comb}"`);
                    const existe = await verificarCodigoExistente(comb);
                    //console.log(`📦 Existe "${comb}":`, existe);
                    if (!existe) return comb;
                }
            }
        }
    }

    //console.warn("No se pudo generar código único de 2 letras.");
    return null;
};

const codigoRegla5A = async (nombre) => {
    const palabras = limpiarPalabras(nombre);
    const base = palabras[0]?.charAt(0).toUpperCase() || "X";
    //console.log("Código generado (nivel 5+):", base);

    let codigo = base;
    let sufijo = 2;
    while (await verificarCodigoExistente(codigo)) {
        codigo = `${base}${sufijo}`;
        sufijo++;
    }

    return codigo;
};

export const generarCodigo = async (nombre, nivel) => {
    if (!nombre) return "";

    const texto = nombre.trim();
    const comienzaConNumero = /^\d/.test(texto);

    const palabras = limpiarPalabras(nombre);

    // Espera si empieza con número antes de validar
    if (comienzaConNumero) {
        setTimeout(() => {}, 0); // Esto marca intención, pero real espera se hace en CrudNiveles
    }

    if (nivel >= 3 && comienzaConNumero) {
        const medida = await reglaPesosMedidas(nombre);
        if (medida) return medida;
    }

    let codigo = "";

    if (nivel >= 5) {
        return await codigoRegla5A(nombre);
    } else if (nivel === 1) {
        if (palabras.length === 1) {
            codigo = palabras[0].substring(0, 3).toUpperCase();
        } else if (palabras.length === 2) {
            const primera = palabras[0].charAt(0).toUpperCase();
            const segunda = palabras[1].substring(0, 2).toUpperCase();
            codigo = (primera + segunda).substring(0, 3);
        } else {
            codigo = palabras.slice(0, 3).map(p => p.charAt(0).toUpperCase()).join("");
        }
    } else if (nivel >= 2 && nivel <= 4) {
        if (palabras.length === 1) {
            codigo = palabras[0].substring(0, 2).toUpperCase();
        } else {
            codigo = palabras.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("").slice(0, 2);
        }
    } else {
        const iniciales = palabras.map(p => p.charAt(0).toUpperCase()).join("");
        codigo = iniciales.slice(0, 3);
    }

    return codigo;
};

export const verificarCodigoExistente = async (codigo) => {
    try {
        const response = await axios.get(`${API_URL}/niveles`);
        return response.data.some(nivel => nivel.codigo === codigo);
    } catch (error) {
        //console.error("Error al verificar código:", error);
        return false;
    }
};

export const generarCodigoAlternativo = async (codigoBase, nombre, nivel) => {

    if (nivel === 1) {
        const codigoUnico3L = await codigoRegla1(nombre);
        if (codigoUnico3L) return codigoUnico3L;
    }

    if (nivel >= 2 && nivel <= 4) {
        const medida = await reglaPesosMedidas(nombre);
        if (medida) return medida;

        const codigoUnico2L = await codigoRegla2a4(nombre);
        if (codigoUnico2L) return codigoUnico2L;
    }

    if (nivel >= 5) {
        const medida = await reglaPesosMedidas(nombre);
        if (medida) return medida;

        return await codigoRegla5A(nombre);
    }

    //console.warn("No se encontró un código  único válido con las reglas definidas. Se mantiene el código base:", codigoBase);
    return codigoBase;
};

