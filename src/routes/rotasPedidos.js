const express = require("express");
const { autorizacaoUsuario } = require("../middlewares/autorizacao");
const { cadastrarPedido, listarPedidos } = require("../controllers/pedidos");

const rotasPedidos = express.Router();
rotasPedidos.use(autorizacaoUsuario);

rotasPedidos.post("/pedido", cadastrarPedido);
rotasPedidos.get("/pedido", listarPedidos);

module.exports = rotasPedidos;
