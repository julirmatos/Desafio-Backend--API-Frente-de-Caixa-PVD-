const knex = require('../config/conexao');

const cadastrarClientes = async (req, res) => {

    try {
        const clienteNovo = await knex("clientes")
            .insert(req.body)
            .returning("*");
        
        return res.status(201).json(clienteNovo[0]);
    } catch (error) {
        return res.status(500).json({mensagem: `Erro interno do servidor.`});
    }

};
const editarDadosCliente = async (req, res) => {
    const { id } = req.params;

    try {
        const clienteAtualizado = await knex.select('*').from("clientes").where({id}).update(req.body).returning('*');

        return res.status(200).json(clienteAtualizado[0]);

    } catch (error) {
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

const listarClientes = async (req, res) => {
    try {
        const clientes = await knex('clientes').select('*');

        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const detalharClientes = async (req, res) => {
    const id = req.params.id;

    try {
        const cliente = await knex('clientes').where({ id }).first();

        if (!cliente) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};

module.exports = {
    cadastrarClientes,
    editarDadosCliente,
    listarClientes,
    detalharClientes,
};
