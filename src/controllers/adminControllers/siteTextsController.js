const siteTextsModel = require('../../models/siteTextsModel');
const fs = require('fs').promises;
const path = require('path');

// Caminho absoluto da pasta public/img/imgIntro dentro do projeto
const IMG_DIR = path.join(__dirname, '../../../public/img/imgIntro');

async function processarImagem(req, imgAntiga = null) {
    if (!req.files || !req.files.file) return imgAntiga;

    const imgFile = req.files.file;
    const imgName = Date.now() + '-' + imgFile.name;

    // Cria a pasta se não existir
    await fs.mkdir(IMG_DIR, { recursive: true });

    const uploadPath = path.join(IMG_DIR, imgName);

    // Salva o arquivo
    await imgFile.mv(uploadPath);

    // Remove imagem antiga
    if (imgAntiga) {
        const oldPath = path.join(IMG_DIR, imgAntiga);
        await fs.unlink(oldPath).catch(() => {}); // ignora se não existir
    }

    return imgName;
}

async function mostrarTextos(req, res) {
    const textosDB = await siteTextsModel.listarTextos();

    const textos = {};
    textosDB.forEach(item => {
        textos[item.key_name] = item.value;
    });

    const campos = [
        { key: 'header_title', label: 'Título do Cabeçalho', type: 'text' },
        { key: 'mainbanner_heading', label: 'Título Principal (Banner)', type: 'text' },
        { key: 'mainbanner_subheading', label: 'Subtítulo (Banner)', type: 'text' },
        { key: 'footer_text', label: 'Texto do Rodapé', type: 'text' },
        { key: 'mainbanner_img1', label: 'Imagem 1 do Banner', type: 'file' },
        { key: 'mainbanner_img2', label: 'Imagem 2 do Banner', type: 'file' },
        { key: 'mainbanner_img3', label: 'Imagem 3 do Banner', type: 'file' },
        { key: 'facebook', label: 'Facebook', type: 'text' },
        { key: 'instagram', label: 'Instagram', type: 'text' },
        { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
        { key: 'tiktok', label: 'TikTok', type: 'text' }
    ];

    res.render('admin/manageSiteTexts', { 
        adminStyle: "cssConponenteAdmin/styleTestSite.css", 
        textos, 
        campos 
    });
}

async function atualizarTexto(req, res) {
    const { key_name, value } = req.body;
    await siteTextsModel.atualizarTexto(key_name, value);
    res.redirect('/admin/site-texts');
}

async function uploadImagem(req, res) {
    try {
        const { key_name, imgAntiga } = req.body;

        const img = await processarImagem(req, imgAntiga);

        if (!img) return res.redirect('/admin/site-texts');

        await siteTextsModel.atualizarTexto(key_name, img);

        res.redirect('/admin/site-texts');
    } catch {
        res.redirect('/admin/site-texts');
    }
}

module.exports = { mostrarTextos, atualizarTexto, uploadImagem };
