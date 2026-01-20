// models/agendamentosModel.js
const goData = require('../services/nodeApiClient.service.js');
const diaNullModel = require('./diaNullModel.js');
const orariosNullModel = require('./orariosNullModel.js');
const professionalScheduleModel = require('./professionalScheduleModel.js');

const TABLE = 'agendamentos';

/**
 * Verifica se um horário está ocupado
 */
async function verificarHorario(profissional_id, data, hora) {
    const result = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data,
            hora,
            status: 'agendado'
        },
        limit: 1
    });

    return result?.data && result.data.length > 0;
}

/**
 * Criar agendamento
 */
async function criarAgendamento(
    cliente_id,
    profissional_id,
    servico_id,
    data,
    hora,
    observacoes = null
) {
    const result = await goData.insert({
        table: TABLE,
        data: {
            cliente_id,
            profissional_id,
            servico_id,
            data,
            hora,
            observacoes,
            status: 'agendado'
        }
    });

    return result;
}

/**
 * Listar agendamentos de um cliente
 */
async function listarPorCliente(cliente_id) {
    const agendamentos = await goData.get({
        table: TABLE,
        filter: { cliente_id },
        order: 'data ASC, hora ASC'
    });

    if (!agendamentos?.data || agendamentos.data.length === 0) {
        return [];
    }

    // Busca serviços e profissionais
    const [servicos, profissionais] = await Promise.all([
        goData.get({ table: 'servicos', fields: ['id', 'nome'] }),
        goData.get({ table: 'profissionais', fields: ['id', 'nome'] })
    ]);

    // Formata resultado
    return agendamentos.data.map(ag => {
        const dataObj = new Date(ag.data);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR');

        return {
            id: ag.id,
            data: dataFormatada,
            hora: ag.hora.slice(0, 5),
            status: ag.status,
            servico: servicos?.data?.find(s => s.id === ag.servico_id)?.nome || 'N/A',
            profissional: profissionais?.data?.find(p => p.id === ag.profissional_id)?.nome || 'N/A'
        };
    });
}

/**
 * Listar agendamentos futuros de um cliente
 */
async function listarFuturosPorCliente(cliente_id) {
    const hoje = new Date().toISOString().split('T')[0];

    const agendamentos = await goData.get({
        table: TABLE,
        filter: {
            cliente_id,
            status: 'agendado'
        },
        order: 'data ASC, hora ASC'
    });

    if (!agendamentos?.data) return [];

    // Filtra apenas agendamentos >= hoje
    const futuros = agendamentos.data.filter(ag => ag.data >= hoje);

    if (futuros.length === 0) return [];

    // Busca serviços e profissionais
    const [servicos, profissionais] = await Promise.all([
        goData.get({ table: 'servicos', fields: ['id', 'nome'] }),
        goData.get({ table: 'profissionais', fields: ['id', 'nome'] })
    ]);

    return futuros.map(ag => ({
        id: ag.id,
        data: ag.data,
        hora: ag.hora,
        status: ag.status,
        observacoes: ag.observacoes,
        servico: servicos?.data?.find(s => s.id === ag.servico_id)?.nome || 'N/A',
        profissional: profissionais?.data?.find(p => p.id === ag.profissional_id)?.nome || 'N/A'
    }));
}

/**
 * Buscar agendamento por ID
 */
async function buscarPorId(id) {
    const result = await goData.get({
        table: TABLE,
        filter: { id },
        limit: 1
    });

    return result?.data?.[0] || null;
}

/**
 * Deletar agendamento
 */
async function deletarAgendamento(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Listar horários agendados de um profissional em uma data
 */
async function listarHorarios(profissional_id, data) {
    const agendamentos = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data
        },
        order: 'hora ASC'
    });

    if (!agendamentos?.data || agendamentos.data.length === 0) {
        return [];
    }

    // Busca nomes dos clientes
    const clientes = await goData.get({
        table: 'clientes',
        fields: ['id', 'nome']
    });

    return agendamentos.data.map(ag => ({
        id: ag.id,
        hora: ag.hora,
        status: ag.status,
        cliente_nome: clientes?.data?.find(c => c.id === ag.cliente_id)?.nome || 'N/A'
    }));
}

/**
 * Listar horários disponíveis para o ADMIN (apenas lista de strings)
 */
async function listarHorariosDisponiveisAtualizado(profissional_id, data) {
    const diasBloqueados = await diaNullModel.listarDiasBloqueados(profissional_id);
    const diaBloqueado = diasBloqueados.some(
        d => d.data.toISOString?.().split('T')[0] === data || d.data === data
    );

    if (diaBloqueado) return [];

    const diaSemanaNum = new Date(data + 'T00:00:00').getDay();
    const mapDias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaSemana = mapDias[diaSemanaNum];

    const grade = await professionalScheduleModel.listarGradeProfissional(profissional_id);
    const diaGrade = grade.find(g => g.dia_semana === diaSemana);

    if (!diaGrade || diaGrade.abre === 0) return [];

    const horarios = gerarHorarios(
        diaGrade.abertura,
        diaGrade.fechamento,
        diaGrade.pausa_inicio,
        diaGrade.pausa_fim
    );

    const agendadosResult = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data,
            status: 'agendado'
        }
    });

    const agendados = agendadosResult?.data?.map(r => r.hora.slice(0, 5)) || [];
    let disponiveis = horarios.filter(h => !agendados.includes(h));

    const bloqueios = await orariosNullModel.listarOrariosBloqueados(profissional_id, data);
    const bloqueados = bloqueios.map(b => b.hora.slice(0, 5));
    disponiveis = disponiveis.filter(h => !bloqueados.includes(h));

    return disponiveis;
}

/**
 * Listar horários disponíveis para CLIENTE (com status)
 */
async function listarHorariosDisponiveisCliente(profissional_id, data) {
    const diaBloqueado = await diaNullModel.verificarDiaBloqueado(profissional_id, data);
    if (diaBloqueado) return [];

    const diaSemanaNum = new Date(data + 'T00:00:00').getDay();
    const mapDias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaSemana = mapDias[diaSemanaNum];

    const grade = await professionalScheduleModel.listarGradeProfissional(profissional_id);
    const diaGrade = grade.find(g => g.dia_semana === diaSemana);

    if (!diaGrade || diaGrade.abre === 0) return [];

    const horarios = gerarHorarios(
        diaGrade.abertura,
        diaGrade.fechamento,
        diaGrade.pausa_inicio,
        diaGrade.pausa_fim
    );

    const agendadosResult = await goData.get({
        table: TABLE,
        filter: {
            profissional_id,
            data,
            status: 'agendado'
        }
    });

    const agendados = agendadosResult?.data?.map(r => r.hora.slice(0, 5)) || [];

    const bloqueios = await orariosNullModel.listarOrariosBloqueados(profissional_id, data);
    const bloqueados = bloqueios.map(b => b.hora.slice(0, 5));

    return horarios.map(h => ({
        hora: h,
        disponivel: !agendados.includes(h) && !bloqueados.includes(h),
        agendamento: agendados.includes(h) ? { hora: h } : null
    }));
}

/**
 * Função auxiliar: gera lista de horários
 */
function gerarHorarios(abertura, fechamento, pausa_inicio, pausa_fim) {
    const horarios = [];
    const intervalo = 30; // minutos

    function horaSoma(horaStr, minutosAdd) {
        const [h, m] = horaStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h);
        d.setMinutes(m + minutosAdd);
        return d.toTimeString().split(' ')[0].slice(0, 5);
    }

    let horaAtual = abertura.slice(0, 5);
    const horaFim = fechamento.slice(0, 5);
    const pausaIni = pausa_inicio?.slice(0, 5);
    const pausaFim = pausa_fim?.slice(0, 5);

    while (horaAtual < horaFim) {
        if (pausaIni && pausaFim && horaAtual >= pausaIni && horaAtual < pausaFim) {
            horaAtual = pausaFim;
            continue;
        }

        horarios.push(horaAtual);
        horaAtual = horaSoma(horaAtual, intervalo);
    }

    return horarios;
}

module.exports = {
    verificarHorario,
    criarAgendamento,
    listarPorCliente,
    listarFuturosPorCliente,
    buscarPorId,
    deletarAgendamento,
    listarHorarios,
    listarHorariosDisponiveisAtualizado,
    listarHorariosDisponiveisCliente
};
