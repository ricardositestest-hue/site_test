// models/professionalScheduleModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'professional_schedule';

/**
 * Listar grade semanal de um profissional (ordenada)
 */
async function listarGradeProfissional(profissional_id) {
    const result = await goData.get({
        table: TABLE,
        filter: { profissional_id }
    });

    if (!result?.data) return [];

    // Ordena manualmente já que o backend pode não suportar FIELD()
    const ordem = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    return result.data.sort((a, b) => {
        return ordem.indexOf(a.dia_semana) - ordem.indexOf(b.dia_semana);
    });
}

/**
 * Listar grade semanal (alias)
 */
async function listarProfessionalSchedule(profissional_id) {
    return listarGradeProfissional(profissional_id);
}

/**
 * Criar ou atualizar grade de um dia específico
 */
async function criarOuAtualizarGrade(
    profissional_id,
    dia_semana,
    abre,
    abertura,
    pausa_inicio,
    pausa_fim,
    fechamento
) {
    // Verifica se já existe
    const existente = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            dia_semana
        },
        limit: 1
    });

    const data = {
        abre,
        abertura,
        pausa_inicio,
        pausa_fim,
        fechamento
    };

    if (existente?.data && existente.data.length > 0) {
        // Atualiza
        await goData.update({
            table: TABLE,
            id: existente.data[0].id,
            data
        });
    } else {
        // Cria
        await goData.insert({
            table: TABLE,
            data: {
                profissional_id,
                dia_semana,
                ...data
            }
        });
    }
}

/**
 * Deletar grade de um dia específico
 */
async function deletarGrade(profissional_id, dia_semana) {
    // Busca o registro
    const existente = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            dia_semana
        },
        limit: 1
    });

    if (existente?.data && existente.data.length > 0) {
        await goData.remove({
            table: TABLE,
            id: existente.data[0].id
        });
    }
}

/**
 * Atualizar grade semanal completa
 */
async function atualizarProfessionalSchedule(profissional_id, dados) {
    const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

    for (const dia of dias) {
        const abre = dados[`${dia}_abre`] === 'on' ? 1 : 0;
        const abertura = dados[`${dia}_abertura`] || '09:00:00';
        const pausa_inicio = dados[`${dia}_pausa_inicio`] || null;
        const pausa_fim = dados[`${dia}_pausa_fim`] || null;
        const fechamento = dados[`${dia}_fechamento`] || '18:00:00';

        await criarOuAtualizarGrade(
            profissional_id,
            dia,
            abre,
            abertura,
            pausa_inicio,
            pausa_fim,
            fechamento
        );
    }
}

module.exports = {
    listarGradeProfissional,
    listarProfessionalSchedule,
    criarOuAtualizarGrade,
    deletarGrade,
    atualizarProfessionalSchedule
};
