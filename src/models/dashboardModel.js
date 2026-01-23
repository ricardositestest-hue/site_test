// models/dashboardModel.js
const goData = require('../services/goData.service.js');

// Data atual YYYY-MM-DD
const hojeSQL = () => new Date().toISOString().split('T')[0];

/**
 * ====================================================
 * LUCRO DO DIA
 * ====================================================
 */
async function lucroHoje() {
  const agendamentos = await goData.get({
    table: 'agendamentos',
    filter: {
      data: hojeSQL(),
      status: 'concluido'
    },
    fields: ['servico_id']
  });

  if (agendamentos.length === 0) return 0;

  const servicos = await goData.get({
    table: 'servicos',
    fields: ['id', 'preco']
  });

  let total = 0;

  for (const ag of agendamentos) {
    const servico = servicos.find(s => s.id === ag.servico_id);
    if (servico) {
      total += Number(servico.preco);
    }
  }

  return total;
}

/**
 * ====================================================
 * LUCRO DA SEMANA
 * ====================================================
 */
async function lucroSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay() || 7; // domingo = 7
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diaSemana + 1);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  const dataInicio = inicio.toISOString().split('T')[0];
  const dataFim = fim.toISOString().split('T')[0];

  const agendamentos = await goData.get({
    table: 'agendamentos',
    filter: { status: 'concluido' },
    fields: ['servico_id', 'data']
  });

  const daSemana = agendamentos.filter(
    a => a.data >= dataInicio && a.data <= dataFim
  );

  if (daSemana.length === 0) return 0;

  const servicos = await goData.get({
    table: 'servicos',
    fields: ['id', 'preco']
  });

  let total = 0;

  for (const ag of daSemana) {
    const servico = servicos.find(s => s.id === ag.servico_id);
    if (servico) {
      total += Number(servico.preco);
    }
  }

  return total;
}

/**
 * ====================================================
 * TOTAL DE AGENDAMENTOS DE HOJE
 * ====================================================
 */
async function totalAgendamentosHoje() {
  const result = await goData.aggregate({
    table: 'agendamentos',
    operation: 'COUNT',
    filter: {
      data: hojeSQL(),
      status: 'agendado'
    }
  });

  return Number(result?.result || 0);
}

/**
 * ====================================================
 * LISTAR AGENDA DE HOJE
 * ====================================================
 */
async function listarAgendaHoje() {
  const agendamentos = await goData.get({
    table: 'agendamentos',
    filter: {
      data: hojeSQL(),
      status: 'agendado'
    },
    order: 'hora ASC'
  });

  if (agendamentos.length === 0) return [];

  const [clientes, servicos, profissionais] = await Promise.all([
    goData.get({ table: 'clientes', fields: ['id', 'nome'] }),
    goData.get({ table: 'servicos', fields: ['id', 'nome'] }),
    goData.get({ table: 'profissionais', fields: ['id', 'nome'] })
  ]);

  return agendamentos.map(ag => ({
    id: ag.id,
    hora: ag.hora,
    cliente: clientes.find(c => c.id === ag.cliente_id)?.nome || 'N/A',
    servico: servicos.find(s => s.id === ag.servico_id)?.nome || 'N/A',
    profissional: profissionais.find(p => p.id === ag.profissional_id)?.nome || 'N/A',
    observacoes: ag.observacoes
  }));
}

module.exports = {
  lucroHoje,
  lucroSemana,
  totalAgendamentosHoje,
  listarAgendaHoje
};
