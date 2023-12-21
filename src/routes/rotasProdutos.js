const express = require("express");
const { autorizacaoUsuario } = require("../middlewares/autorizacao");
const {
  cadastrarProduto,
  detalharProduto,
  excluirProduto,
  editarProduto,
  listarProdutos,
} = require("../controllers/produtos");

const multer = require("../middlewares/multer");

const rotasProdutos = express.Router();

rotasProdutos.use(autorizacaoUsuario);

rotasProdutos.get("/produto", listarProdutos);
rotasProdutos.post("/produto", multer.single("produto_imagem"), cadastrarProduto);
rotasProdutos.get("/produto/:id?", detalharProduto);
rotasProdutos.put("/produto/:id?", multer.single("produto_imagem"), editarProduto);
rotasProdutos.delete("/produto/:id?", excluirProduto);

module.exports = rotasProdutos;
