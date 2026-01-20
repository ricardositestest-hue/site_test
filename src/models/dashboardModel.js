// models/dashboardModel.js
const goData = require('../services/nodeApiClient.service.js');

const hojeSQL = () => new Date().toISOString().split('T')[0];

/**
 * Lucro do dia (soma dos serviços concluídos hoje)
 */
async function lucroHoje() {
    // Busca agendamentos concluídos de hoje
    const agendamentos = await goData.get({
        table: 'agendamentos',
        filter: { 
            data: hojeSQL(),
            status: 'concluido'
        },
        fields: ['servico_id']
    });

    if (!agendamentos?.data || agendamentos.data.length === 0) {
        return 0;
    }

    // Busca os preços dos serviços
    const servicoIds = agendamentos.data.map(a => a.servico_id);
    const servicos = await goData.get({
        table: 'servicos',
        fields: ['id', 'preco']
    });

    // Calcula o total
    let total = 0;
    agendamentos.data.forEach(ag => {
        const servico = servicos?.data?.find(s => s.id === ag.servico_id);
        if (servico) {
            total += parseFloat(servico.preco);
        }
    });

    return total;
}

/**
 * Lucro da semana
 */
async function lucroSemana() {
    // Calcula primeiro e último dia da semana atual
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const primeiroDia = new Date(hoje);
    primeiroDia.setDate(hoje.getDate() - diaSemana + 1); // Segunda-feira
    
    const ultimoDia = new Date(primeiroDia);
    ultimoDia.setDate(primeiroDia.getDate() + 6); // Domingo

    const dataInicio = primeiroDia.toISOString().split('T')[0];
    const dataFim = ultimoDia.toISOString().split('T')[0];

    // Busca agendamentos da semana
    const agendamentos = await goData.get({
        table: 'agendamentos',
        filter: { status: 'concluido' }
    });

    if (!agendamentos?.data) return 0;

    // Filtra manualmente os da semana
    const agendamentosSemana = agendamentos.data.filter(ag => {
        return ag.data >= dataInicio && ag.data <= dataFim;
    });

    if (agendamentosSemana.length === 0) return 0;

    // Busca serviços
    const servicos = await goData.get({
        table: 'servicos',
        fields: ['id', 'preco']
    });

    // Calcula total
    let total = 0;
    agendamentosSemana.forEach(ag => {
        const servico = servicos?.data?.find(s => s.id === ag.servico_id);
        if (servico) {
            total += parseFloat(servico.preco);
        }
    });

    return total;
}

/**
 * Total de agendamentos de hoje
 */
async function totalAgendamentosHoje() {
    const result = await goData.aggregate({
        table: 'agendamentos',
        pipeline: {
            operation: 'COUNT',
            filter: {
                data: hojeSQL(),
                status: 'agendado'
            }
        }
    });

    return result?.result || 0;
}

/**
 * Lista agendamentos de hoje com detalhes
 */
async function listarAgendaHoje() {
    // Busca agendamentos de hoje
    const agendamentos = await goData.get({
        table: 'agendamentos',
        filter: {
            data: hojeSQL(),
            status: 'agendado'
        },
        order: 'hora ASC'
    });

    if (!agendamentos?.data || agendamentos.data.length === 0) {
        return [];
    }

    // Busca clientes, serviços e profissionais
    const [clientes, servicos, profissionais] = await Promise.all([
        goData.get({ table: 'clientes', fields: ['id', 'nome'] }),
        goData.get({ table: 'servicos', fields: ['id', 'nome'] }),
        goData.get({ table: 'profissionais', fields: ['id', 'nome'] })
    ]);

    // Monta resultado com nomes
    return agendamentos.data.map(ag => ({
        id: ag.id,
        hora: ag.hora,
        cliente: clientes?.data?.find(c => c.id === ag.cliente_id)?.nome || 'N/A',
        servico: servicos?.data?.find(s => s.id === ag.servico_id)?.nome || 'N/A',
        profissional: profissionais?.data?.find(p => p.id === ag.profissional_id)?.nome || 'N/A',
        observacoes: ag.observacoes
    }));
}

module.exports = {
    lucroHoje,
    lucroSemana,
    totalAgendamentosHoje,
    listarAgendaHoje
};
