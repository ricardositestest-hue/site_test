const serviceModel = require('../../models/serviceModel');
const fs = require('fs').promises;
const path = require('path');

// Caminho absoluto da pasta public/img/servises dentro do projeto
const UPLOAD_DIR = path.join(__dirname, '../../../public/img/servises');

async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => { textos[t.key_name] = t.value; });
    return textos;
}

// Função auxiliar para salvar imagem
async function salvarImagem(file, antigaImg = null) {
    if (!file) return antigaImg;

    // Gera nome único
    const imgName = Date.now() + '-' + file.name;

    // Cria pasta se não existir
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Caminho final
    const uploadPath = path.join(UPLOAD_DIR, imgName);

    // Move arquivo
    await file.mv(uploadPath);

    // Remove imagem antiga
    if (antigaImg) {
        const oldPath = path.join(UPLOAD_DIR, antigaImg);
        await fs.unlink(oldPath).catch(() => {});
    }

    return imgName;
}

// Listar serviços
async function mostrarServicos(req, res) {
    const textos = await testPadrao();
    const servicos = await serviceModel.listarServicos();
    res.render('admin/manageServices', { 
        adminStyle:"cssConponenteAdmin/styleServices.css",
        textos,
        servicos
    });
}

// Criar serviço
async function criarServico(req, res) {
    const textos = await testPadrao();
    const { nome, duracao_min, preco } = req.body;

    if (!nome || !duracao_min || !preco || !req.files?.img) {
        const servicos = await serviceModel.listarServicos();
        return res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            error: 'Todos os campos são obrigatórios', 
            servicos 
        });
    }

    try {
        const img = await salvarImagem(req.files.img);
        await serviceModel.criarServico(nome, duracao_min, preco, img);

        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            success: 'Serviço criado com sucesso!', 
            servicos 
        });
    } catch {
        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            error: 'Erro ao criar o serviço.', 
            servicos 
        });
    }
}

// Atualizar serviço
async function atualizarServico(req, res) { 
    const textos = await testPadrao();
    const { id, nome, duracao_min, preco, imgName } = req.body;

    try {
        const newImgName = await salvarImagem(req.files?.img, imgName);
        await serviceModel.atualizarServico(id, nome, duracao_min, preco, newImgName);

        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            success: 'Serviço atualizado!',
            textos,
            servicos 
        });
    } catch {
        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            error: 'Erro ao atualizar serviço.',
            servicos 
        });
    }
}

// Deletar serviço
async function deletarServico(req, res) {
    const textos = await testPadrao();
    const { id, img } = req.params;

    try {
        await serviceModel.deletarServico(id);
        if (img) await fs.unlink(path.join(UPLOAD_DIR, img)).catch(() => {});

        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            success: 'Serviço removido!',
            servicos 
        });
    } catch {
        const servicos = await serviceModel.listarServicos();
        res.render('admin/manageServices', { 
            adminStyle:"cssConponenteAdmin/styleServices.css",
            textos,
            error: 'Erro ao remover serviço.',
            servicos 
        });
    }
}

module.exports = { 
    mostrarServicos, 
    criarServico, 
    atualizarServico, 
    deletarServico 
};
