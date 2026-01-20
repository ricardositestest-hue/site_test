// models/professionalModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'profissionais';

/**
 * Criar novo profissional
 */
async function criarProfissional(nome, especialidade, img) {
    if (!nome || nome.trim() === '') {
        throw new Error('Nome do profissional é obrigatório');
    }

    const result = await goData.insert({
        table: TABLE,
        data: {
            nome: nome.trim(),
            especialidade: especialidade?.trim() || null,
            img: img || null,
            ativo: 1
        }
    });

    return result;
}

/**
 * Listar profissionais (ativos ou inativos)
 */
async function listarProfissionais(ativos = true) {
    const result = await goData.get({
        table: TABLE,
        filter: { ativo: ativos ? 1 : 0 },
        order: 'nome ASC'
    });

    return result || [];
}

/**
 * Buscar profissional por ID
 */
async function buscarProfissionalPorId(id) {
    const result = await goData.get({
        table: TABLE,
        filter: { id },
        limit: 1
    });

    return result?.data?.[0] || null;
}

/**
 * Atualizar dados de um profissional
 */
async function atualizarProfissional(id, nome, especialidade, img, ativo) {
    if (!nome || nome.trim() === '') {
        throw new Error('Nome do profissional é obrigatório');
    }

    const data = {
        nome: nome.trim(),
        especialidade: especialidade?.trim() || null,
        ativo: ativo ? 1 : 0
    };

    if (img) {
        data.img = img;
    }

    const result = await goData.update({
        table: TABLE,
        id,
        data
    });

    return result;
}

/**
 * Deletar profissional
 */
async function deletarProfissional(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Listar profissionais para home do cliente (apenas ativos)
 */
async function listarProfissionaisHome() {
    const result = await goData.get({
        table: TABLE,
        filter: { ativo: 1 },
        order: 'nome ASC'
    });

    return result?.data || [];
}

module.exports = {
    criarProfissional,
    listarProfissionais,
    buscarProfissionalPorId,
    atualizarProfissional,
    deletarProfissional,
    listarProfissionaisHome
};

