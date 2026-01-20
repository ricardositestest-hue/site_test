// models/serviceModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'servicos';

/**
 * Listar todos os serviços
 */
async function listarServicos() {
    const result = await goData.get({
        table: TABLE,
        order: 'criado_em DESC'
    });

    return result || [];
}

/**
 * Criar novo serviço
 */
async function criarServico(nome, duracao_min, preco, img) {
    const result = await goData.insert({
        table: TABLE,
        data: {
            nome,
            duracao_min,
            preco,
            img: img || null
        }
    });

    return result;
}

/**
 * Listar serviços para home (todos os serviços)
 */
async function listarServicosHome() {
    return listarServicos();
}

/**
 * Atualizar serviço
 */
async function atualizarServico(id, nome, duracao_min, preco, imgName) {
    const data = {
        nome,
        duracao_min,
        preco
    };

    if (imgName) {
        data.img = imgName;
    }

    const result = await goData.update({
        table: TABLE,
        id,
        data
    });

    return result;
}

/**
 * Deletar serviço
 */
async function deletarServico(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

module.exports = {
    listarServicos,
    criarServico,
    listarServicosHome,
    atualizarServico,
    deletarServico
};

