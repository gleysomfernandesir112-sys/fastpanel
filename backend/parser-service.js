// /var/www/fastpanel/backend/parser-service.js

const express = require('express');
const { parseM3uFromFile } = require('./src/services/m3uParserService');
const path = require('path');

const app = express();
app.use(express.json());

const PARSER_PORT = process.env.PARSER_PORT || 8083; // Porta diferente da API principal

/**
 * Endpoint para processar um ficheiro M3U local.
 * Recebe: { filePath: "/caminho/completo/para/ficheiro.m3u" }
 * Retorna: O objeto JSON da playlist analisada ou um erro.
 */
app.post('/parse', async (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ message: 'Falta o campo obrigatório: filePath' });
    }

    // Garante que o caminho seja absoluto (segurança e consistência)
    const absoluteFilePath = path.resolve(filePath);

    console.log(`[Serviço de Parsing] Recebido pedido para analisar: ${absoluteFilePath}`);

    try {
        // Chama a função assíncrona que lê e analisa o ficheiro
        const parsedPlaylist = await parseM3uFromFile(absoluteFilePath);
        
        console.log(`[Serviço de Parsing] Analisado com sucesso: ${absoluteFilePath}`);
        res.status(200).json(parsedPlaylist); // Retorna o resultado analisado

    } catch (error) {
        console.error(`[Serviço de Parsing] Erro ao analisar o ficheiro ${absoluteFilePath}:`, error);
        res.status(500).json({ message: error.message || 'Falha ao analisar o ficheiro M3U.' });
    }
});

app.listen(PARSER_PORT, '127.0.0.1', () => { // Escuta apenas localmente (localhost)
    console.log(`[Serviço de Parsing] Serviço de parsing a escutar em http://127.0.0.1:${PARSER_PORT}`);
});
