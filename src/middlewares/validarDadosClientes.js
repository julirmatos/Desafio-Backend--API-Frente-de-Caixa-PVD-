const knex = require('../config/conexao');

const validarDadosClientes = async (req, res, next) => {

    const { nome, email, cpf, cep } = req.body;
    const { id } = req.params;

    
    if (!nome || !email || !cpf) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos" });
    }
    
    if(nome.trim() == "" || email.trim() == "" || cpf.trim() == ""){
        return res
        .status(400)
        .json({mensagem: "Todos os campos são obrigatórios."});
    }
    const emailValido = email.slice(email.indexOf('@')).includes('.');
    
    if(!emailValido){
        return res.status(400).json({mensagem: `E-mail inválido.`});
    }

    if(isNaN(cpf)){
        return res.status(400).json({mensagem: `CPF inválido.`});
    }
    
    if(id){
        if(!id || isNaN(id)){
            return res.status(400).json({mensagem: `Informe o id do cliente.`});
        }

        const clienteExistente = await knex.select('*').from("clientes").where({id});

        if (!clienteExistente[0]) {
            return res.status(404).json({ mensagem: "Cliente não encontrado." });
        }

        const clienteComMesmoEmail = await knex.select('*').from("clientes").where({email}).whereNot({id});
        
        if (clienteComMesmoEmail[0]) {
            return res.status(400).json({ error: "E-mail já está em uso por outro cliente." });
        }

        const clienteComMesmoCPF = await knex.select('*').from("clientes").where({cpf}).whereNot({id});
        
        if (clienteComMesmoCPF[0]){
            return res.status(400).json({ error: "CPF já está sendo usado por outro cliente" });
        } 
    }


    const verificarEmail = await knex.select('*').from('clientes').where({email});

    if(verificarEmail[0]){
        return res.status(400).json({mensagem: `E-mail já está cadastrado.`});
    }

    const verificarCPF = await knex.select('*').from('clientes').where({cpf});

    if(verificarCPF[0]){
        return res.status(400).json({mensagem: `CPF já está cadastrado.`});
    }
    
    if(cep){
        if(isNaN(cep)){
            return res.status(400).json({mensagem: `CEP inválido.`});
        }
    }

    next();
    
}

module.exports = validarDadosClientes;