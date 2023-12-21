const express = require("express");
const { listarCategorias } = require("../controllers/categorias");

const rotasCategorias = express.Router();
rotasCategorias.get("/categoria", listarCategorias);

module.exports = rotasCategorias;
