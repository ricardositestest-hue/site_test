// models/dashboardModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const hojeSQL = () => new Date().toISOString().split('T')[0];

// ============================================================================
// LUCRO DO DIA
// ============================================================================
async function lucroHoje() {
  const hoje = hojeSQL();

  // Buscar agendamentos concluídos de hoje
  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      data: hoje,
      status: 'concluido'
    },
    select: ['servico_id']
  });

  if (agendamentos.length === 0) return 0;

  // Buscar preços dos serviços
  let total = 0;
  for (let agendamento of agendamentos) {
    const servicos = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['preco'],
      limit: 1
    });

    if (servicos[0]) {
      total += parseFloat(servicos[0].preco);
    }
  }

  return total;
}

// ============================================================================
// LUCRO DA SEMANA
// ============================================================================
async function lucroSemana() {
  // Pegar o primeiro dia da semana (segunda-feira)
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diff = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const primeiroDia = new Date(hoje.setDate(diff)).toISOString().split('T')[0];

  // Buscar agendamentos concluídos da semana
  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      status: 'concluido'
    },
    select: ['data', 'servico_id']
  });

  // Filtrar apenas desta semana
  const agendamentosSemana = agendamentos.filter(a => a.data >= primeiroDia);

  if (agendamentosSemana.length === 0) return 0;

  // Buscar preços
  let total = 0;
  for (let agendamento of agendamentosSemana) {
    const servicos = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['preco'],
      limit: 1
    });

    if (servicos[0]) {
      total += parseFloat(servicos[0].preco);
    }
  }

  return total;
}

// ============================================================================
// TOTAL DE AGENDAMENTOS HOJE
// ============================================================================
async function totalAgendamentosHoje() {
  const hoje = hojeSQL();

  const total = await goData.aggregate({
    table: 'agendamentos',
    operation: 'COUNT',
    where: {
      data: hoje,
      status: 'agendado'
    }
  });

  return total;
}

// ============================================================================
// LISTA DE AGENDAMENTOS DE HOJE
// ============================================================================
async function listarAgendaHoje() {
  const hoje = hojeSQL();

  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      data: hoje,
      status: 'agendado'
    },
    order_by: 'hora ASC'
  });

  // Buscar dados relacionados
  for (let agendamento of agendamentos) {
    const [cliente] = await goData.get({
      table: 'clientes',
      where: { id: agendamento.cliente_id },
      select: ['nome'],
      limit: 1
    });

    const [servico] = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['nome'],
      limit: 1
    });

    const [profissional] = await goData.get({
      table: 'profissionais',
      where: { id: agendamento.profissional_id },
      select: ['nome'],
      limit: 1
    });

    agendamento.cliente = cliente?.nome || 'N/A';
    agendamento.servico = servico?.nome || 'N/A';
    agendamento.profissional = profissional?.nome || 'N/A';
  }

  return agendamentos;
}

// ============================================================================
// ESTATÍSTICAS GERAIS
// ============================================================================
async function estatisticasGerais() {
  const totalClientes = await goData.aggregate({
    table: 'clientes',
    operation: 'COUNT'
  });

  const totalServicos = await goData.aggregate({
    table: 'servicos',
    operation: 'COUNT'
  });

  const totalProfissionais = await goData.aggregate({
    table: 'profissionais',
    operation: 'COUNT',
    where: { ativo: 1 }
  });

  return {
    totalClientes,
    totalServicos,
    totalProfissionais
  };
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  lucroHoje,
  lucroSemana,
  totalAgendamentosHoje,
  listarAgendaHoje,
  estatisticasGerais
};