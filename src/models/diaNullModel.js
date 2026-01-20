// models/diaNullModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'dia_null';

/**
 * Listar dias bloqueados de um profissional (a partir de hoje)
 */
async function listarDiasBloqueados(profissional_id) {
    const hoje = new Date().toISOString().split('T')[0];

    const result = await goData.get({
        table: TABLE,
        filter: { profissional_id },
        order: 'data ASC'
    });

    if (!result?.data) return [];

    // Filtra apenas datas >= hoje
    return result.data.filter(d => d.data >= hoje);
}

/**
 * Criar bloqueio de dia
 */
async function criarDiaBloqueado(profissional_id, data, motivo) {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Não permite datas passadas
    if (data < hoje) {
        throw new Error('Não é possível bloquear datas passadas');
    }

    const result = await goData.insert({
        table: TABLE,
        data: {
            profissional_id,
            data,
            motivo: motivo || null
        }
    });

    return result;
}

/**
 * Deletar bloqueio de dia
 */
async function deletarDiaBloqueado(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Verificar se um dia está bloqueado
 */
async function verificarDiaBloqueado(profissional_id, data) {
    const result = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data
        },
        limit: 1
    });

    return result?.data && result.data.length > 0;
}

module.exports = {
    listarDiasBloqueados,
    criarDiaBloqueado,
    deletarDiaBloqueado,
    verificarDiaBloqueado
};
