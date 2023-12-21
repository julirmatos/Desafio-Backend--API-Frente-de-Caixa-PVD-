require("dotenv").config();
const express = require("express");

const rotasCategorias = require("./routes/rotasCategorias");
const rotasUsuarios = require("./routes/rotasUsuarios");
const rotasProdutos = require("./routes/rotasProdutos");
const rotasClientes = require("./routes/rotasClientes");
const rotasPedidos = require("./routes/rotasPedidos");

const app = express();

app.use(express.json());

app.use(rotasCategorias, rotasUsuarios, rotasProdutos, rotasClientes, rotasPedidos);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
