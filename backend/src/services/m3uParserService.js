const parser = require('iptv-playlist-parser');
const axios = require('axios');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Analisa o conteúdo bruto da playlist M3U.
 * @param {string} content O conteúdo bruto da playlist M3U como uma string.
 * @returns {object} O objeto da playlist analisado.
 */
const parseM3uContent = (content) => {
    try {
        if (!content || typeof content !== 'string' || content.trim() === '') {
            throw new Error('O conteúdo M3U está vazio ou é inválido.');
        }
        const parsedPlaylist = parser.parse(content);
        return parsedPlaylist;
    } catch (error) {
        console.error(`Falha crítica ao analisar conteúdo M3U. O conteúdo pode estar malformado. Erro:`, error);
        // Em caso de erro de parsing, retorna um objeto de playlist vazio para não quebrar a aplicação.
        return { items: [] };
    }
};

/**
 * Busca uma playlist M3U a partir de um URL e a analisa. (HTTP/HTTPS)
 * @param {string} m3uUrl O URL da playlist M3U.
 * @returns {Promise<object>} O objeto da playlist analisado.
 */
const parseM3uFromUrl = async (m3uUrl) => {
    try {
        const response = await axios.get(m3uUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 15000, // 15 segundos de timeout
        });
        const playlistContent = response.data;
        return parseM3uContent(playlistContent);
    } catch (error) {
        console.error(`Erro ao buscar ou analisar a playlist de ${m3uUrl}:`, error);
        throw new Error('Falha ao buscar ou analisar a playlist M3U.');
    }
};

/**
 * Lê uma playlist M3U a partir de um ficheiro local e a analisa.
 * @param {string} filePath O caminho local para o ficheiro M3U.
 * @returns {Promise<object>} O objeto da playlist analisado.
 */
const parseM3uFromFile = async (filePath) => {
    try {
        const absolutePath = path.resolve(filePath);
        console.log(`[Parser] A ler o ficheiro de: ${absolutePath}`);
        const playlistContent = await fsPromises.readFile(absolutePath, 'utf-8');
        return parseM3uContent(playlistContent);
    } catch (error) {
        console.error(`Erro ao ler ou analisar a playlist de ${filePath}:`, error);
        throw new Error('Falha ao ler ou analisar o ficheiro M3U.');
    }
};

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const MASTER_PLAYLIST_NAME = "Master Client Playlist";

/**
 * Adivinha o tipo de stream (CANAL, FILME, SERIE) baseado no título do grupo.
 * @param {string} groupTitle O título do grupo do stream.
 * @returns {'CANAL'|'FILME'|'SERIE'} O tipo de stream adivinhado.
 */
const guessStreamType = (groupTitle) => {
    if (!groupTitle) return 'CANAL'; // Padrão
    const title = groupTitle.toUpperCase();

    if (title.includes('FILME') || title.includes('MOVIE')) {
        return 'FILME';
    }
    if (title.includes('SERIE') || title.includes('SERIES')) {
        return 'SERIE';
    }
    return 'CANAL';
};

/**
 * Analisa uma string de conteúdo M3U, verifica por duplicatas no banco de dados e retorna itens novos e duplicados.
 * @param {string} m3uContent O conteúdo bruto da playlist M3U como uma string.
 * @returns {Promise<object>} Um objeto contendo { newItems, duplicateItems }.
 */
const analyzeM3uString = async (m3uContent) => {
    const parsedPlaylist = parseM3uContent(m3uContent);
    const items = parsedPlaylist.items || [];

    if (items.length === 0) {
        return { newItems: [], duplicateItems: [] };
    }

    // Encontrar a playlist mestra
    const masterPlaylist = await prisma.playlist.findFirst({
        where: { name: MASTER_PLAYLIST_NAME },
    });

    if (!masterPlaylist) {
        // Se a playlist mestra não existe, todos os itens são considerados novos.
        // Opcional: Lançar um erro se a playlist mestra for estritamente necessária.
        console.warn("A Playlist Mestra não foi encontrada. Todos os itens serão tratados como novos.");
        return { newItems: items, duplicateItems: [] };
    }

    // Extrair todas as URLs dos itens analisados
    const itemUrls = items.map(item => item.url).filter(url => url);

    // Encontrar todos os streams existentes na playlist mestra que correspondem às URLs
    const existingStreams = await prisma.stream.findMany({
        where: {
            playlistId: masterPlaylist.id,
            streamUrl: {
                in: itemUrls,
            },
        },
        select: {
            streamUrl: true,
        },
    });

    const existingUrls = new Set(existingStreams.map(s => s.streamUrl));

    const newItems = [];
    const duplicateItems = [];

    for (const item of items) {
        // Adiciona o tipo de stream adivinhado ao item
        const enhancedItem = {
            ...item,
            streamType: guessStreamType(item.group?.title),
        };

        if (existingUrls.has(item.url)) {
            duplicateItems.push(enhancedItem);
        } else {
            newItems.push(enhancedItem);
        }
    }

    return { newItems, duplicateItems };
};


module.exports = {
    parseM3uFromUrl,
    parseM3uContent,
    parseM3uFromFile,
    analyzeM3uString,
};
