const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const playlistCache = require('./cacheService');
const axios = require('axios'); // Necessário para comunicar com o serviço de parsing

// Função para atualizar a cache de uma única playlist
const updatePlaylistCache = async (playlist) => {
    console.log(`[Worker] A atualizar a cache para a playlist: ${playlist.name} (ID: ${playlist.id})`);

    const isFileUpload = playlist.url && playlist.url.startsWith('file://');
    const isMasterPlaylist = playlist.name === "Master Client Playlist";
    let tempFilePath = null;

    try {
        let parsedM3uItems = [];

        if (isMasterPlaylist) {
            // Para a playlist mestra, os streams já estão no DB
            const streams = await prisma.stream.findMany({
                where: { playlistId: playlist.id },
                select: { name: true, streamUrl: true }, // Seleciona apenas os campos necessários
            });
            parsedM3uItems = streams.map(s => ({ name: s.name, url: s.streamUrl }));
            console.log(`[Worker] Streams carregados do DB para a playlist mestra: ${playlist.name} com ${parsedM3uItems.length} itens.`);

        } else if (isFileUpload) {
            const { fileURLToPath } = require('url');
            tempFilePath = fileURLToPath(playlist.url);
            
            console.log(`[Worker] A enviar o caminho do ficheiro para o Serviço de Parsing: ${tempFilePath}`);
            const response = await axios.post('http://localhost:8083/parse', { filePath: tempFilePath });
            parsedM3uItems = response.data.items;

        } else if (playlist.url) {
            const { parseM3uFromUrl } = require('./m3uParserService');
            console.log(`[Worker] A analisar o URL diretamente: ${playlist.url}`);
            const parsedM3u = await parseM3uFromUrl(playlist.url);
            parsedM3uItems = parsedM3u.items;
        } else {
            throw new Error('A playlist não tem URL, caminho de ficheiro válido ou não é a playlist mestra.');
        }

        if (!parsedM3uItems || parsedM3uItems.length === 0) {
            throw new Error('A playlist está vazia ou o conteúdo M3U é inválido.');
        }

        playlistCache.set(`playlist_${playlist.id}`, parsedM3uItems);
        console.log(`[Worker] Cache atualizada com sucesso para a playlist: ${playlist.name} com ${parsedM3uItems.length} itens.`);

        await prisma.playlist.update({
            where: { id: playlist.id },
            data: { status: 'ONLINE' },
        });

    } catch (error) {
        const errorMessage = error.response ? error.response.data.message : error.message;
        console.error(`[Worker] Falha ao atualizar a cache para a playlist ${playlist.id}:`, errorMessage);
        
        playlistCache.del(`playlist_${playlist.id}`);
        try {
            await prisma.playlist.update({
                where: { id: playlist.id },
                data: { status: 'OFFLINE' },
            });
        } catch (dbError) {
            console.error(`[Worker] Falha ao atualizar o status da playlist para OFFLINE para o id ${playlist.id}:`, dbError);
        }
    } finally {
        if (tempFilePath) {
            try {
                await fsPromises.unlink(tempFilePath);
                console.log(`[Worker] Ficheiro temporário ${tempFilePath} eliminado.`);
            } catch (cleanupError) {
                if (cleanupError.code !== 'ENOENT') {
                    console.error(`[Worker] Erro ao eliminar o ficheiro temporário ${tempFilePath}:`, cleanupError);
                }
            }
        }
    }
};

// Função para atualizar todas as playlists na base de dados
const refreshAllPlaylists = async () => {
    console.log('[Worker] A verificar playlists para processar...');
    try {
        const playlistsToProcess = await prisma.playlist.findMany({
            where: {
                status: { in: ['VERIFICANDO', 'OFFLINE'] }
            }
        });

        if (playlistsToProcess.length > 0) {
            console.log(`[Worker] Encontradas ${playlistsToProcess.length} playlists para processar.`);
            for (const playlist of playlistsToProcess) {
                await updatePlaylistCache(playlist);
            }
            console.log('[Worker] Ciclo de processamento de playlists concluído.');
        } else {
            console.log('[Worker] Nenhuma playlist precisa de processamento neste momento.');
        }
    } catch (error) {
        console.error('[Worker] Ocorreu um erro durante o ciclo de atualização de playlists:', error);
    }
};

// Função para iniciar o background worker
const start = () => {
    console.log('Background worker iniciado. A aguardar o próximo ciclo.');
    
    // Executa uma vez imediatamente no início
    refreshAllPlaylists();

    // Depois, executa a cada 5 minutos (300000 milissegundos)
    setInterval(refreshAllPlaylists, 300000);
};

module.exports = {
    start,
    updatePlaylistCache,
    refreshAllPlaylists,
};
