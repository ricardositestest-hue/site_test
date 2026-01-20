// models/clienteModel.js
const goData = require('../services/nodeApiClient.service.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const TABLE = 'clientes';

/**
 * Criar novo cliente
 */
async function criarCliente(nome, email, telefone, senha) {
    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const result = await goData.insert({
        table: TABLE,
        data: {
            nome,
            email,
            telefone,
            senha_hash
        }
    });

    return result;
}

/**
 * Buscar cliente pelo email
 */
async function buscarClientePorEmail(email) {
    const result = await goData.get({
        table: TABLE,
        filter: { email },
        limit: 1
    });

    return result?.data?.[0] || null;
}

/**
 * Validar login
 */
async function validarLogin(email, senha) {
    const cliente = await buscarClientePorEmail(email);

    if (!cliente) return null;

    const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);

    if (!senhaValida) return null;

    return cliente;
}

/**
 * Atualizar perfil do cliente
 */
async function atualizarPerfil(id, nome, email, telefone, senha) {
    const data = { nome, email, telefone };

    if (senha && senha.trim() !== '') {
        const hash = await bcrypt.hash(senha, SALT_ROUNDS);
        data.senha_hash = hash;
    }

    const result = await goData.update({
        table: TABLE,
        id,
        data
    });

    return result;
}

/**
 * Salvar token de recuperação de senha
 */
async function salvarTokenRecuperacao(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await goData.batchUpdate({
        table: TABLE,
        filter: { email },
        data: {
            reset_token: token,
            reset_token_expira: expira.toISOString().slice(0, 19).replace('T', ' ')
        }
    });

    return token;
}

/**
 * Buscar cliente por token de recuperação
 */
async function buscarPorToken(token) {
    const result = await goData.get({
        table: TABLE,
        filter: { reset_token: token },
        limit: 1
    });

    const cliente = result?.data?.[0];

    if (!cliente) return null;

    // Verifica se o token ainda é válido
    const agora = new Date();
    const expira = new Date(cliente.reset_token_expira);

    if (agora > expira) return null;

    return cliente;
}

/**
 * Atualizar senha do cliente
 */
async function atualizarSenha(id, senha) {
    const hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const result = await goData.update({
        table: TABLE,
        id,
        data: {
            senha_hash: hash,
            reset_token: null,
            reset_token_expira: null
        }
    });

    return result;
}

module.exports = {
    criarCliente,
    buscarClientePorEmail,
    validarLogin,
    atualizarPerfil,
    salvarTokenRecuperacao,
    buscarPorToken,
    atualizarSenha
};
