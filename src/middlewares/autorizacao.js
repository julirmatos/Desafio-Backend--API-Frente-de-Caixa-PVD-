const jwt = require("jsonwebtoken");
const knex = require("../config/conexao");

async function autorizacaoUsuario(req, res, next) {
  const { authorization } = req.headers;

  try {
    if (!authorization) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const token = authorization.split(" ")[1];

    const { id } = jwt.verify(token, process.env.JWTPASSWORD);
    const users = await knex("usuarios").where({ id: id });

    if (!users.length) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { senha: _, ...usuario } = users[0];

    req.usuario = usuario;

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { autorizacaoUsuario };
