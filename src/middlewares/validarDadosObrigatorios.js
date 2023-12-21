const knex = require('../config/conexao');

const validarDadosObrigatorios = async (req, res, next) => {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res
          .status(400)
          .json({ mensagem: "Todos os campos são obrigatórios."});
    }

    if(nome.trim() == "" || email.trim() == "" || senha.trim() == ""){
        return res
            .status(400)
            .json({mensagem: "Todos os campos são obrigatórios."});
    }

    const emailValido = email.slice(email.indexOf('@')).includes('.');

    if(!emailValido){
        return res
            .status(400)
            .json({mensagem: "E-mail inválido."});
    }

    const emailExistente = await knex.select('*').from('usuarios').where({ email });

    if (emailExistente[0]) {
      return res.status(400).json({
        mensagem: "Já existe usuário cadastrado com o e-mail informado.",
      });
    }
    
    next();
}

module.exports = validarDadosObrigatorios;