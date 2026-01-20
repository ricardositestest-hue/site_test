// models/adminModel.js
const goData = require('../services/nodeApiClient.service.js');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const TABLE = 'admin';

/**
 * Validar login do administrador
 */
async function validarLogin(email, senha) {
    const result = await goData.get({
        table: TABLE,
        filter: { email },
        limit: 1
    });

    const admin = result?.data?.[0];
    
    if (!admin) return null;

    const senhaValida = await bcrypt.compare(senha, admin.senha_hash);
    
    if (!senhaValida) return null;

    return admin;
}

/**
 * Atualizar dados do admin (nome e email)
 */
async function atualizarAdmin(id, nome, email) {
    const result = await goData.update({
        table: TABLE,
        id,
        data: {
            nome,
            email
        }
    });

    return result;
}

/**
 * Atualizar senha do admin
 */
async function atualizarSenha(id, novaSenha) {
    const senha_hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

    const result = await goData.update({
        table: TABLE,
        id,
        data: { senha_hash }
    });

    return result;
}

/**
 * Deletar admin
 */
async function deletarAdmin(id) {
    const result = await goData.remove({
        table: TABLE,
        id
    });

    return result;
}

/**
 * Contar total de administradores
 */
async function contarAdmins() {
    const result = await goData.aggregate({
        table: TABLE,
        pipeline: {
            operation: 'COUNT'
        }
    });

    return result?.result || 0;
}

/**
 * Criar novo admin
 */
async function criarAdmin(nome, email, senha) {
    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const result = await goData.insert({
        table: TABLE,
        data: {
            nome,
            email,
            senha_hash
        }
    });

    return result;
}

/**
 * Listar todos os administradores
 */
async function listarAdmins() {
    const result = await goData.get({
        table: TABLE,
        fields: ['id', 'nome', 'email', 'criado_em'],
        order: 'criado_em DESC'
    });

    return result?.data || [];
}

module.exports = {
    validarLogin,
    atualizarAdmin,
    atualizarSenha,
    deletarAdmin,
    contarAdmins,
    criarAdmin,
    listarAdmins
};
