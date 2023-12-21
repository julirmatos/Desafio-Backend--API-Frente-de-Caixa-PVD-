const express = require("express");
const { cadastroDoUsuario, detalharUsuario, editarPerfil, redefinirSenhaUsuario, loginUsuario } = require("../controllers/usuarios");
const { autorizacaoUsuario } = require("../middlewares/autorizacao");
const validarDadosObrigatorios = require("../middlewares/validarDadosObrigatorios");

const rotasUsuarios = express.Router();
rotasUsuarios.post("/login", loginUsuario);
rotasUsuarios.post("/usuario", validarDadosObrigatorios, cadastroDoUsuario);
rotasUsuarios.get("/usuario", autorizacaoUsuario, detalharUsuario);
rotasUsuarios.put("/usuario", autorizacaoUsuario, validarDadosObrigatorios, editarPerfil);
rotasUsuarios.patch("/usuario/redefinir", redefinirSenhaUsuario);

module.exports = rotasUsuarios;
