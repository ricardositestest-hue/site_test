// models/orariosNullModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'orarios_null';

/**
 * Listar horários bloqueados de um profissional em uma data
 */
async function listarOrariosBloqueados(profissional_id, data) {
    if (!profissional_id || !data) return [];

    const hoje = new Date().toISOString().split('T')[0];
    
    // Não retorna horários de datas passadas
    if (data < hoje) return [];

    const result = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data
        },
        order: 'hora ASC'
    });

    return result?.data || [];
}

/**
 * Criar bloqueio de horário
 */
async function criarHorarioBloqueado(profissional_id, data, hora, motivo) {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Não permite adicionar horário no passado
    if (data < hoje) {
        throw new Error('Não é possível bloquear horários no passado');
    }

    const result = await goData.insert({
        table: TABLE,
        data: {
            profissional_id,
            data,
            hora,
            motivo: motivo || null
        }
    });

    return result;
}

/**
 * Deletar bloqueio de horário
 */
async function deletarHorarioBloqueado(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Verificar se uma hora está bloqueada
 */
async function verificarHoraBloqueada(profissional_id, data, hora) {
    const result = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data,
            hora
        },
        limit: 1
    });

    return result?.data && result.data.length > 0;
}

module.exports = {
    listarOrariosBloqueados,
    criarHorarioBloqueado,
    deletarHorarioBloqueado,
    verificarHoraBloqueada
};
