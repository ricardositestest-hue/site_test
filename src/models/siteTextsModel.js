// models/siteTextsModel.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'site_texts';

/**
 * Listar todos os textos do site
 */
async function listarTextos() {
    const result = await goData.get({
        table: TABLE
    });

    return result?.data || [];
}

/**
 * Buscar texto por chave
 */
async function buscarTextoPorKey(key_name) {
    const result = await goData.get({
        table: TABLE,
        filter: { key_name },
        limit: 1
    });

    return result?.data?.[0] || null;
}

/**
 * Atualizar texto do site
 */
async function atualizarTexto(key_name, value) {
    // Busca o registro existente
    const existente = await buscarTextoPorKey(key_name);

    if (!existente) {
        throw new Error(`Chave ${key_name} não encontrada`);
    }

    const result = await goData.update({
        table: TABLE,
        id: existente.id,
        data: { value }
    });

    return result;
}

module.exports = {
    listarTextos,
    buscarTextoPorKey,
    atualizarTexto
};
