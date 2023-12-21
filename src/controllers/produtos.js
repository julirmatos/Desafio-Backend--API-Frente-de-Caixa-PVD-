const knex = require("../config/conexao");
const { uploadImagem, s3 } = require("../servicos/uploads");

const cadastrarProduto = async (req, res) => {
  const { descricao, quantidade_estoque, categoria_id, valor } = req.body;

  if (!descricao || !quantidade_estoque || !categoria_id || !valor) {
    return res
      .status(400)
      .json({ mensagem: `Todos os campos são obrigatórios.` });
  }

  if (
    typeof descricao != "string" ||
    isNaN(quantidade_estoque) ||
    isNaN(valor) ||
    isNaN(categoria_id)
  ) {
    return res.status(400).json({ mensagem: `Dados inválidos.` });
  }

  try {
    const buscarCategoria = await knex("categorias")
      .where("id", categoria_id)
      .first();

    if (!buscarCategoria) {
      return res.status(400).json({ mensagem: "Categoria Inválida" });
    }

    const produto = await knex("produtos")
      .whereILike("descricao", descricao)
      .first();

    let cadastrarProduto;

    if (!produto) {
      cadastrarProduto = await knex("produtos")
        .insert({
          descricao,
          quantidade_estoque,
          categoria_id,
          valor,
        })
        .returning("*");

      const id = cadastrarProduto[0].id;

      if (req.file) {

        const { originalname, mimetype, buffer } = req.file;

        const produto_imagem = await uploadImagem(
          `produtos/${id}/${originalname}`,
          buffer,
          mimetype
        );

        await knex("produtos")
          .update({
            produto_imagem: produto_imagem.path,
          })
          .where({ id });

        cadastrarProduto[0].produto_imagem = produto_imagem.url;
      }

    } else {
      return res
        .status(400)
        .json({ mensagem: `Produto já cadastrado para o id ${produto.id}` });
    }

    if (cadastrarProduto.length === 0) {
      return res
        .status(400)
        .json({ mensagem: "Ocorreu um problema no cadastro do produto." });
    }

    return res.status(201).json(cadastrarProduto[0]);
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }

};

const detalharProduto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ mensagem: `Informe o id do produto.` });
    }

    const produto = await knex("produtos")
      .join("categorias", "produtos.categoria_id", "=", "categorias.id")
      .select("produtos.*", "categorias.descricao as categoria_nome")
      .where({ "produtos.id": id });

    if (!produto.length) {
      return res
        .status(400)
        .json({ mensagem: `Não há produto cadastrado para o id informado.` });
    }
    return res.status(200).json(produto[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: `Erro interno do servidor.` });
  }
};

const editarProduto = async (req, res) => {

  const { descricao, quantidade_estoque, categoria_id, valor } = req.body;

  if (!descricao || !quantidade_estoque || !categoria_id || !valor) {
    return res
      .status(400)
      .json({ mensagem: `Todos os campos são obrigatórios.` });
  }

  const categoriaExiste = await knex
    .select("*")
    .from("categorias")
    .where({ id: categoria_id });

  if (!categoriaExiste[0]) {
    return res.status(400).json({ mensagem: `Informe uma categoria válida.` });
  }

  const { id } = req.params;

  if (
    typeof descricao != "string" ||
    isNaN(quantidade_estoque) ||
    isNaN(valor) ||
    isNaN(categoria_id)
  ) {
    return res.status(400).json({ mensagem: `Dados inválidos.` });
  }

  if (!id || isNaN(id)) {
    return res.status(400).json({ mensagem: `Informe o id do produto.` });
  }

  try {
    const atualizarProduto = await knex("produtos")
      .update(req.body)
      .where({ id })
      .returning("*");

    if (!atualizarProduto[0]) {
      return res.status(404).json({ mensagem: `Produto não encontrado` });
    }

    if (req.file) {
      const { originalname, mimetype, buffer } = req.file;

      const produto_imagem = await uploadImagem(
        `produtos/${id}/${originalname}`,
        buffer,
        mimetype
      );

      await knex("produtos")
        .update({
          produto_imagem: produto_imagem.path,
        })
        .where({ id });

      atualizarProduto[0].produto_imagem = produto_imagem.url;
    }

    return res
      .status(200)
      .json(atualizarProduto[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: `Erro interno do servidor` });
  }
};

const listarProdutos = async function (req, res) {
  const { categoria_id } = req.query;

  try {
    if (!categoria_id) {
      const produtos = await knex.select("*").from("produtos");
      return res.status(200).json({ produtos });
    } else if (isNaN(categoria_id)) {
      return res.status(400).json({ mensagem: `Categoria inválida.` });
    }

    const verificaCategoria = await knex
      .select("*")
      .from("categorias")
      .where({ id: categoria_id });

    if (!verificaCategoria[0]) {
      return res.status(404).json({ mensagem: `Categoria não encontrada.` });
    }

    const produtos = await knex
      .select("*")
      .from("produtos")
      .where({ categoria_id });

    return res.status(200).json({ produtos });
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ mensagem: `Informe o id do produto.` });
    }

    const produto = await knex("produtos").where({ id }).first();

    if (!produto) {
      return res
        .status(400)
        .json({ mensagem: `Não há produto cadastrado para o id informado.` });
    }

    const pedidoComProduto = await knex
      .select("*")
      .from("pedido_produtos")
      .where({ produto_id: id })
      .first();

    if (pedidoComProduto) {
      return res.status(400).json({
        mensagem: `Produto não pode ser excluído, pois já foi vinculado a um pedido.`,
      });
    };
    
    
    if(produto.produto_imagem){

      const file = produto.produto_imagem;
      
      await s3.deleteObject({
        Bucket: process.env.BUCKET_NAME,
        Key: file
      }).promise()

    };
    
    await knex("produtos").delete().where({ id });

    return res.status(204).send();
  
  } catch (error) {
    return res.status(500).json({ mensagem: `Erro interno do servidor.` });
  }
};

module.exports = {
  cadastrarProduto,
  detalharProduto,
  editarProduto,
  listarProdutos,
  excluirProduto,
};
