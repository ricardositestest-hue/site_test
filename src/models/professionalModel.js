// models/professionalModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'profissionais';

// ============================================================================
// CRIAR PROFISSIONAL
// ============================================================================
async function criarProfissional(nome, especialidade = null, img = null) {
  if (!nome || nome.trim() === '') {
    throw new Error('Nome do profissional é obrigatório');
  }

  return await goData.insert({
    table: TABLE,
    data: {
      nome: nome.trim(),
      especialidade: especialidade?.trim() || null,
      img: img || null,
      ativo: 1
    }
  });
}

// ============================================================================
// LISTAR PROFISSIONAIS (ADMIN)
// ============================================================================
async function listarProfissionais(ativos = true) {
  return await goData.get({
    table: TABLE,
    where: { ativo: ativos ? 1 : 0 },
    order_by: 'nome ASC'
  });
}

// ============================================================================
// LISTAR PROFISSIONAIS PARA HOME (CLIENTE)
// ============================================================================
async function listarProfissionaisHome(limit = 0) {
  const params = {
    table: TABLE,
    where: { ativo: 1 },
    order_by: 'nome ASC'
  };

  if (limit > 0) {
    params.limit = limit;
  }

  return await goData.get(params);
}

// ============================================================================
// BUSCAR PROFISSIONAL POR ID
// ============================================================================
async function buscarProfissionalPorId(id) {
  const profissionais = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return profissionais[0] || null;
}

// ============================================================================
// ATUALIZAR PROFISSIONAL
// ============================================================================
async function atualizarProfissional(id, nome, especialidade = null, img = null, ativo = true) {
  if (!nome || nome.trim() === '') {
    throw new Error('Nome do profissional é obrigatório');
  }

  const data = {
    nome: nome.trim(),
    especialidade: especialidade?.trim() || null,
    ativo: ativo ? 1 : 0
  };

  // Só atualiza a imagem se foi fornecida
  if (img) {
    data.img = img;
  }

  await goData.update({
    table: TABLE,
    data,
    where: { id }
  });
}

// ============================================================================
// DELETAR PROFISSIONAL
// ============================================================================
async function deletarProfissional(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  criarProfissional,
  listarProfissionais,
  listarProfissionaisHome,
  buscarProfissionalPorId,
  atualizarProfissional,
  deletarProfissional
};