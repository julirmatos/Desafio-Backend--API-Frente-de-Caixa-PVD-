const knex = require('../config/conexao');
const { hash } = require("bcrypt");
const transportador = require('../config/email');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const cadastroDoUsuario = async (req, res) => {

  const { nome, email, senha } = req.body;

  try {

    const criptografiaDaSenha = await hash(senha, parseInt(process.env.BCRYPT_HASH, 10));

    const novoUsuario = await knex("usuarios").insert({
      nome,
      email,
      senha: criptografiaDaSenha,
    }).returning('*');

    const { senha: _, ...user } = novoUsuario[0];

    return res.status(201).json(user);

  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const detalharUsuario = async (req, res) => {
  try {
    const { id } = req.usuario;

    const perfilUsuario = await knex
      .select("id", "nome", "email")
      .from("usuarios")
      .where({ id });

    return res.status(200).json(perfilUsuario[0]);
  } catch (error) {
    return res.status(400).json({ messagem: `Erro interno do servidor.` });
  }
};

const editarPerfil = async (req, res) => {
  const { nome, email, senha } = req.body;
  const { id } = req.usuario;

  try {

    const senhaCriptografada = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_HASH, 10));

    const atualizarUsuario = await knex('usuarios').update({nome, email, senha: senhaCriptografada}).where({id}).returning('*');

    const { senha:_, ...usaurioAtualizado } = atualizarUsuario[0];

    return res.status(200).json(usaurioAtualizado);

  } catch (error) {
    return res.status(500).json({message: `Erro interno do servidor.`});
  }
}

const redefinirSenhaUsuario = async (req, res) => {
  const { email, senha_antiga, senha_nova } = req.body;

  if (!email || !senha_antiga || !senha_nova) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const usuario = await knex('usuarios').where({ email }).first();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  
    const senhaValida = await bcrypt.compare(senha_antiga, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ error: "Senha antiga incorreta" });
    }

    const senhaNovaCriptografada = await bcrypt.hash(senha_nova, parseInt(process.env.BCRYPT_HASH, 10));

    if (senha_antiga === senha_nova) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha antiga.' });
    }

    await knex('usuarios').where({ email }).update({ senha: senhaNovaCriptografada });

    transportador.sendMail({
      from: `${process.env.EMAIL_NAME} < ${process.env.EMAIL_FROM} >`,
      to: `${usuario.nome} < ${usuario.email} >`,
      subject: 'Senha Alterada',
      text: 'Senha Alterada com Sucesso!'
    });

    res.json({ message: 'Senha Alterada com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

const loginUsuario = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'É necessário informar e-mail e senha.' });
  }

  try {
    const users = await knex.select().from("usuarios").where({ email: email });
    if (!users.length) {
      return res.status(400).json({ error: "Email e senha invalidos" });
    }
    const senhaCriptografada = users[0].senha;

    const senhaValida = await bcrypt.compare(senha, senhaCriptografada);
    if (!senhaValida) {
      return res.status(400).json({ error: "Email e senha invalidos" });
    }

    const { senha: _, ...userLogin } = users[0];
    const token = jwt.sign(
      {
        id: userLogin.id,
      },
      process.env.JWTPASSWORD,
      {
        expiresIn: "8h",
      }
    );

    return res.status(200).json({ usuario: userLogin, token });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};



module.exports = {
  cadastroDoUsuario,
  detalharUsuario,
  editarPerfil,
  redefinirSenhaUsuario,
  loginUsuario
};
