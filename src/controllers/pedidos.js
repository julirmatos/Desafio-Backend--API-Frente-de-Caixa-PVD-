const knex = require("../config/conexao");
const transportador = require('../config/email');

const cadastrarPedido = async (req, res) => {

  const { cliente_id, observacao, pedido_produtos } = req.body;

  if(!cliente_id || !observacao || !pedido_produtos){
    return res.status(400).json({mensagem: `Todos os campos são obrigatórios.`});
  }

  if(isNaN(cliente_id)){
    return res.status(400).json({mensagem: `Id Cliente, Id Produto ou Quantidade de Produto inválida.`});
  }

  for( let pedido of pedido_produtos){
    if(isNaN(pedido.produto_id) || isNaN(pedido.quantidade_produto) || pedido.produto_id == "" || pedido.quantidade_produto <= 0){
      return res.status(400).json({mensagem: `Id do Protudo ou Quantidade inválida.`})
    }
  }
  
  try {

    const buscarCliente = await knex("clientes")
      .where("id", cliente_id)
      .first();

    if (!buscarCliente) {
      return res.status(404).json({ Mensagem: "Cliente não encontrado" });
    }

    let valorTotal = 0;

    for (const pedidos of pedido_produtos) {

      const buscarProduto = await knex("produtos").where("id", pedidos.produto_id).first();
      
      if (!buscarProduto) {
        return res
          .status(404)
          .json({ Mensagem: `Produto de ID ${pedidos.produto_id} não encontrado` });
      }

      if (buscarProduto.quantidade_estoque - pedidos.quantidade_produto < 0) {
        return res.status(400).json({
          Mensagem: `Não há estoque suficiente para a quantidade solicitada do produto ${buscarProduto.descricao}-ID ${buscarProduto.id}. Quantidade em estoque: ${buscarProduto.quantidade_estoque} unidades. Quantidade solicitada: ${pedidos.quantidade_produto} unidades.`,
        });
      }
      valorTotal += buscarProduto.valor * pedidos.quantidade_produto;
    }

    const objPedido = {
      cliente_id,
      observacao,
      valor_total: valorTotal,
    };

    const cadastrarNaTabelaPedido = await knex("pedidos")
      .insert(objPedido)
      .returning("*");

    for (const pedidos of pedido_produtos) {

      const buscarProduto = await knex("produtos").where("id", pedidos.produto_id).first();
      
      const objPedidos = {
        pedido_id: cadastrarNaTabelaPedido[0].id,
        produto_id: pedidos.produto_id,
        quantidade_produto: pedidos.quantidade_produto,
        valor_produto: buscarProduto.valor,
      };

      removerValorestoque = buscarProduto.quantidade_estoque - pedidos.quantidade_produto;

      await knex(
        "pedido_produtos"
      ).insert(objPedidos);
      
      await knex("produtos")
        .update("quantidade_estoque", removerValorestoque)
        .where("id", pedidos.produto_id);
    }

    transportador.sendMail({
      from: `PDV CUBOS <${process.env.EMAIL_FROM}>`,
      to: buscarCliente.email,
      subject: `Seu pedido cadastrado com sucesso!`,
      text: `Olá! Seu pedido foi cadastrado com sucesso.`
    });

    return res.status(201).json({ Mensagem: "Pedido cadastrado com sucesso." });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ messagem: `Erro interno do servidor.` });
  }
};

const listarPedidos = async (req, res) => {
  const { cliente_id } = req.query;
  try{
    if(!cliente_id){

      const pedidos = await knex
      .select("id", "valor_total", "observacao", "cliente_id")
      .from("pedidos");
      
      const listaPedidos = [];

      for(const pedido of pedidos){

        const pedido_produtos = await knex
        .select("id", "quantidade_produto", "valor_produto", "pedido_id", "produto_id")
        .from("pedido_produtos")
        .where("pedido_id", pedido.id);

        listaPedidos.push({pedido, pedido_produtos})

      }

      return res.status(200).json(listaPedidos);

    }else if(isNaN(cliente_id)){
      return res.status(400).json({ mensagem: `O id informado é inválido.` });
    }

    const clienteExiste = await knex.select("*")
      .from("clientes")
      .where("id", cliente_id)
      .first();
    
    if(!clienteExiste){
      return res.status(400).json({ mensagem: `Não há cliente cadastrado com o Id informado` });
    }

    const clienteTemPedido = await knex
      .select("*")
      .from("pedidos")
      .where("cliente_id", cliente_id)
      .first();

    if(!clienteTemPedido){
      return res.status(400).json({ mensagem: `Não há pedido cadastrado para o cliente informado` });
    }

    const pedidosDoCliente = await knex
      .select("id", "valor_total", "observacao", "cliente_id")
      .from("pedidos")
      .where("cliente_id", cliente_id);
      
    const listaPedidosDoCliente = [];

    for(const pedido of pedidosDoCliente){

      const pedido_produtos = await knex
      .select("id", "quantidade_produto", "valor_produto", "pedido_id", "produto_id")
      .from("pedido_produtos")
      .where("pedido_id", pedido.id);

      listaPedidosDoCliente.push({pedido, pedido_produtos})
    }

    return res.status(200).json(listaPedidosDoCliente);

  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

module.exports = {
  cadastrarPedido,
  listarPedidos
};
