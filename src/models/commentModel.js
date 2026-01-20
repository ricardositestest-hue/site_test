// models/commentsModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'comments';

/**
 * Listar comentários ativos (para exibição pública)
 */
async function listarComentarios() {
    const result = await goData.get({
        table: TABLE,
        filter: { ativo: 1 }
    });

    return result || [];
}

/**
 * Listar todos os comentários (admin)
 */
async function listarTodosComentarios() {
    const result = await goData.get({
        table: TABLE
    });

    return result?.data || [];
}

/**
 * Criar novo comentário
 */
async function criarComentario(nome, comentario, img) {
    const result = await goData.insert({
        table: TABLE,
        data: {
            nome,
            comentario,
            img: img || '',
            ativo: 1
        }
    });

    return result;
}

/**
 * Atualizar comentário existente
 */
async function atualizarComentario(id, nome, comentario, img, ativo) {
    const result = await goData.update({
        table: TABLE,
        id,
        data: {
            nome,
            comentario,
            img: img || '',
            ativo: ativo ? 1 : 0
        }
    });

    return result;
}

/**
 * Deletar comentário
 */
async function deletarComentario(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Listar comentários para home (máximo 5)
 */
async function listarComentariosHome() {
    const result = await goData.get({
        table: TABLE,
        filter: { ativo: 1 },
        order: 'id DESC',
        limit: 5
    });

    return result?.data || [];
}

module.exports = {
    listarComentarios,
    listarTodosComentarios,
    criarComentario,
    atualizarComentario,
    deletarComentario,
    listarComentariosHome
};

