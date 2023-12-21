const express = require('express');
const { autorizacaoUsuario } = require('../middlewares/autorizacao');
const validarDadosClientes = require('../middlewares/validarDadosClientes');
const { cadastrarClientes, editarDadosCliente, listarClientes, detalharClientes } = require('../controllers/clientes');
const rotasClientes = express.Router();

rotasClientes.use(autorizacaoUsuario);

rotasClientes.post("/cliente", validarDadosClientes, cadastrarClientes);
rotasClientes.put("/cliente/:id?", validarDadosClientes, editarDadosCliente);
rotasClientes.get("/cliente", listarClientes);
rotasClientes.get("/cliente/:id?", detalharClientes);

module.exports = rotasClientes;
