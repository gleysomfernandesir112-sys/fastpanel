const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const os = require('os');
const { generateM3u } = require('../services/m3uGeneratorService');
const playlistCache = require('../services/cacheService');
const { parseM3uContent, parseM3uFromFile, analyzeM3uString } = require('../services/m3uParserService');
const MASTER_PLAYLIST_NAME = "Master Client Playlist"; // Definido globalmente para o módulo
// A chamada direta ao worker foi removida daqui para evitar bloqueios

// @desc    Obtém todas as playlists do utilizador logado
// @route   GET /api/playlists
const getPlaylists = async (req, res) => {
    try {
        const playlists = await prisma.playlist.findMany({
            where: { ownerId: req.user.id },
            orderBy: { priority: 'asc' },
        });
        res.status(200).json(playlists);
    } catch (error) {
        console.error("Erro em getPlaylists:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Cria uma playlist mesclada a partir de ficheiros .m3u na pasta M3U
// @route   POST /api/playlists/merge-from-folder
const createMergedPlaylistFromFolder = async (req, res) => {
    const M3U_FOLDER_PATH = path.join(__dirname, '../../M3U');
    const { name, priority, selectedStreams } = req.body; // Adicionado selectedStreams

    if (!name || priority === undefined || !selectedStreams) {
        return res.status(400).json({ message: 'Forneça nome, prioridade e streams selecionados para a playlist mesclada.' });
    }

    try {
        // A lógica de leitura de ficheiros da pasta M3U será movida para um novo endpoint
        // Aqui, vamos diretamente usar os selectedStreams fornecidos pelo frontend
        if (selectedStreams.length === 0) {
            return res.status(400).json({ message: 'Nenhum stream selecionado para criar a playlist.' });
        }

        // Gerar o conteúdo M3U mesclado a partir dos streams selecionados
        const mergedM3uContent = generateM3u(selectedStreams);

        // Escrever o conteúdo mesclado para um ficheiro temporário
        const tempFileName = `merged_playlist_${Date.now()}.m3u`;
        const tempFilePath = path.join(os.tmpdir(), tempFileName);
        await fsPromises.writeFile(tempFilePath, mergedM3uContent, 'utf-8');

        const { pathToFileURL } = require('url');
        const tempFileURL = pathToFileURL(tempFilePath).href;

        const newPlaylist = await prisma.playlist.create({
            data: {
                name,
                url: tempFileURL,
                fileName: `merged_from_selection_${Date.now()}.m3u`,
                priority: parseInt(priority, 10),
                ownerId: req.user.id,
                status: 'VERIFICANDO',
            },
        });

        res.status(201).json(newPlaylist);

    } catch (error) {
        console.error("Erro durante createMergedPlaylistFromFolder:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Obtém o conteúdo de todos os ficheiros .m3u na pasta M3U
// @route   GET /api/playlists/m3u-folder-content
const getM3uFilesContent = async (req, res) => {
    const M3U_FOLDER_PATH = path.join(__dirname, '../../M3U');

    try {
        const files = await fsPromises.readdir(M3U_FOLDER_PATH);
        const m3uFiles = files.filter(file => file.endsWith('.m3u'));

        if (m3uFiles.length === 0) {
            return res.status(200).json([]); // Retorna um array vazio se não houver ficheiros
        }

        const allFilesContent = [];

        for (const file of m3uFiles) {
            const filePath = path.join(M3U_FOLDER_PATH, file);
            try {
                const parsedPlaylist = await parseM3uFromFile(filePath);
                allFilesContent.push({
                    fileName: file,
                    items: parsedPlaylist.items || [],
                });
            } catch (parseError) {
                console.warn(`Aviso: Não foi possível analisar o ficheiro ${file}. Ignorando.`, parseError.message);
                // Opcional: Adicionar um item para indicar que o ficheiro falhou na análise
                allFilesContent.push({
                    fileName: file,
                    error: `Falha ao analisar: ${parseError.message}`,
                    items: [],
                });
            }
        }

        res.status(200).json(allFilesContent);

    } catch (error) {
        console.error("Erro durante getM3uFilesContent:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Sincroniza a playlist mestra lendo todos os ficheiros .m3u da pasta M3U
// @route   POST /api/playlists/sync-master
const synchronizeMasterPlaylist = async (req, res) => {
    const M3U_FOLDER_PATH = path.join(__dirname, '../../M3U');

    try {
        const files = await fsPromises.readdir(M3U_FOLDER_PATH);
        const m3uFiles = files.filter(file => file.endsWith('.m3u'));

        if (m3uFiles.length === 0) {
            return res.status(404).json({ message: 'Nenhum ficheiro .m3u encontrado na pasta M3U para sincronizar.' });
        }

        let allMergedItems = [];

        for (const file of m3uFiles) {
            const filePath = path.join(M3U_FOLDER_PATH, file);
            console.log(`A processar ficheiro para sincronização: ${filePath}`);
            const parsedPlaylist = await parseM3uFromFile(filePath);
            if (parsedPlaylist && parsedPlaylist.items) {
                allMergedItems = allMergedItems.concat(parsedPlaylist.items);
            }
        }

        if (allMergedItems.length === 0) {
            return res.status(400).json({ message: 'Não foi possível extrair streams de nenhum ficheiro M3U para sincronização.' });
        }

        // Gerar o conteúdo M3U mesclado
        const mergedM3uContent = generateM3u(allMergedItems);

        // Escrever o conteúdo mesclado para um ficheiro temporário
        const tempFileName = `master_playlist_${Date.now()}.m3u`;
        const tempFilePath = path.join(os.tmpdir(), tempFileName);
        await fsPromises.writeFile(tempFilePath, mergedM3uContent, 'utf-8');

        const { pathToFileURL } = require('url');
        const tempFileURL = pathToFileURL(tempFilePath).href;

        // Encontrar ou criar a playlist mestra
        let masterPlaylist = await prisma.playlist.findFirst({
            where: { name: MASTER_PLAYLIST_NAME },
        });

        if (masterPlaylist) {
            // Atualizar playlist existente
            masterPlaylist = await prisma.playlist.update({
                where: { id: masterPlaylist.id },
                data: {
                    // Removemos url e fileName, pois os streams serão geridos diretamente
                    status: 'VERIFICANDO',
                    streams: {
                        deleteMany: {}, // Apaga todos os streams existentes
                        create: allMergedItems.map(item => ({
                            name: item.name || 'Unknown',
                            streamUrl: item.url || '#',
                            // Adicione outros campos do stream conforme necessário
                        })),
                    },
                },
            });
        } else {
            // Criar nova playlist mestra (assumindo ownerId do usuário logado)
            masterPlaylist = await prisma.playlist.create({
                data: {
                    name: MASTER_PLAYLIST_NAME,
                    priority: 1, // Prioridade alta para a playlist mestra
                    ownerId: req.user.id, // Associa ao usuário logado
                    status: 'VERIFICANDO',
                    streams: {
                        create: allMergedItems.map(item => ({
                            name: item.name || 'Unknown',
                            streamUrl: item.url || '#',
                            // Adicione outros campos do stream conforme necessário
                        })),
                    },
                },
            });
        }

        // Atualiza as contagens do dashboard após a sincronização
        // TODO: Re-habilitar o serviço de dashboard se necessário
        // dashboardService.updateContentCounts();

        res.status(200).json({ message: 'Sincronização da playlist mestra iniciada com sucesso.', playlist: masterPlaylist });

    } catch (error) {
        console.error("Erro durante synchronizeMasterPlaylist:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Obtém todos os streams da playlist mestra
// @route   GET /api/playlists/master/streams
const getMasterPlaylistStreams = async (req, res) => {

    try {
        const masterPlaylist = await prisma.playlist.findFirst({
            where: { name: MASTER_PLAYLIST_NAME },
            include: { streams: true },
        });

        if (!masterPlaylist) {
            return res.status(404).json({ message: 'Playlist Mestra não encontrada.' });
        }

        res.status(200).json(masterPlaylist.streams);

    } catch (error) {
        console.error("Erro durante getMasterPlaylistStreams:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Adiciona um novo stream à playlist mestra
// @route   POST /api/playlists/master/streams
const addMasterPlaylistStream = async (req, res) => {
    const { name, streamUrl, streamType } = req.body;

    if (!name || !streamUrl) {
        return res.status(400).json({ message: 'Nome e URL do stream são obrigatórios.' });
    }

    try {
        const masterPlaylist = await prisma.playlist.findFirst({
            where: { name: MASTER_PLAYLIST_NAME },
        });

        if (!masterPlaylist) {
            return res.status(404).json({ message: 'Playlist Mestra não encontrada.' });
        }

        const newStream = await prisma.stream.create({
            data: {
                name,
                streamUrl,
                streamType: streamType || 'CANAL', // Salva o tipo, com CANAL como padrão
                playlistId: masterPlaylist.id,
            },
        });

        // Invalida a cache da playlist mestra para que o worker a re-processe
        playlistCache.del(`playlist_${masterPlaylist.id}`);
        await prisma.playlist.update({
            where: { id: masterPlaylist.id },
            data: { status: 'VERIFICANDO' },
        });

        // Atualiza as contagens do dashboard
        // TODO: Re-habilitar o serviço de dashboard se necessário
        // dashboardService.updateContentCounts();

        res.status(201).json(newStream);

    } catch (error) {
        console.error("Erro durante addMasterPlaylistStream:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Atualiza um stream existente na playlist mestra
// @route   PUT /api/playlists/master/streams/:streamId
const updateMasterPlaylistStream = async (req, res) => {
    const { streamId } = req.params;
    const { name, streamUrl } = req.body;

    if (!name || !streamUrl) {
        return res.status(400).json({ message: 'Nome e URL do stream são obrigatórios.' });
    }

    try {
        const updatedStream = await prisma.stream.update({
            where: { id: parseInt(streamId) },
            data: {
                name,
                streamUrl,
            },
        });

        // Invalida a cache da playlist mestra para que o worker a re-processe
        const masterPlaylist = await prisma.playlist.findFirst({
            where: { id: updatedStream.playlistId },
        });
        if (masterPlaylist) {
            playlistCache.del(`playlist_${masterPlaylist.id}`);
            await prisma.playlist.update({
                where: { id: masterPlaylist.id },
                data: { status: 'VERIFICANDO' },
            });
        }

        // Atualiza as contagens do dashboard
        // TODO: Re-habilitar o serviço de dashboard se necessário
        // dashboardService.updateContentCounts();

        res.status(200).json(updatedStream);

    } catch (error) {
        console.error("Erro durante updateMasterPlaylistStream:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Remove um stream da playlist mestra
// @route   DELETE /api/playlists/master/streams/:streamId
const deleteMasterPlaylistStream = async (req, res) => {
    const { streamId } = req.params;

    try {
        const deletedStream = await prisma.stream.delete({
            where: { id: parseInt(streamId) },
        });

        // Invalida a cache da playlist mestra para que o worker a re-processe
        const masterPlaylist = await prisma.playlist.findFirst({
            where: { id: deletedStream.playlistId },
        });
        if (masterPlaylist) {
            playlistCache.del(`playlist_${masterPlaylist.id}`);
            await prisma.playlist.update({
                where: { id: masterPlaylist.id },
                data: { status: 'VERIFICANDO' },
            });
        }

        // Atualiza as contagens do dashboard
        // TODO: Re-habilitar o serviço de dashboard se necessário
        // dashboardService.updateContentCounts();

        res.status(200).json({ message: 'Stream removido com sucesso.', stream: deletedStream });

    } catch (error) {
        console.error("Erro durante deleteMasterPlaylistStream:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

const deletePlaylist = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.playlist.delete({ where: { id: parseInt(id) } });
        playlistCache.del(`playlist_${id}`);
        console.log(`Playlist ${id} eliminada e removida da cache.`);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

const refreshPlaylistStatus = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.playlist.update({
            where: { id: parseInt(id) },
            data: { status: 'VERIFICANDO' },
        });
        playlistCache.del(`playlist_${id}`); // Invalida a cache para que o worker re-busque
        res.status(202).json({ message: 'Atualização de playlist iniciada. O worker irá processá-la em breve.' });
    } catch (error) {
        console.error(`Erro ao iniciar a atualização da playlist ${id}:`, error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

const generateClientPlaylist = async (req, res) => {
    const { username, password } = req.query;
    if (!username || !password) {
        return res.status(400).send('Erro: Utilizador e senha são obrigatórios.');
    }
    try {
        const client = await prisma.client.findUnique({ where: { username } });
        if (!client || !(await bcrypt.compare(password, client.password))) {
            return res.status(401).send('Autenticação falhou.');
        }
        if (client.expirationDate && new Date() > client.expirationDate) {
            return res.status(200).send('#EXTM3U\n#EXTINF:-1,Conta expirada\n');
        }

        const M3U_DIR = path.join(__dirname, '../../M3U'); // Correct path to the M3U folder
        const clientM3uFileName = `${username}.m3u`;
        const clientM3uPath = path.join(M3U_DIR, clientM3uFileName);
        let clientM3uContent;

        try {
            clientM3uContent = await fsPromises.readFile(clientM3uPath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                // If the client's M3U file doesn't exist, it might not have been generated yet
                // or there was an issue. Return a placeholder or an error.
                console.warn(`Client M3U file not found for ${username}: ${clientM3uPath}`);
                return res.status(200).send('#EXTM3U\n#EXTINF:-1,Playlist do cliente não gerada ou não encontrada.\n');
            }
            throw error;
        }

        if (!clientM3uContent.trim()) {
            return res.status(200).send('#EXTM3U\n#EXTINF:-1,A playlist do cliente está vazia.\n');
        }
        
        const safeFilename = username.replace(/[^a-zA-Z0-9_.-]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.m3u"`);
        res.status(200).send(clientM3uContent); // Send the content directly, it already has #EXTM3U
    } catch (error) {
        console.error(`Erro ao gerar a playlist para ${username}:`, error);
        res.status(500).send('Erro Interno do Servidor');
    }
};

// @desc    Cria ou atualiza a Master Playlist a partir de uma lista de streams já analisada e aprovada pelo utilizador
// @route   POST /api/playlists/master/create-from-parsed
const createMasterPlaylistFromParsed = async (req, res) => {
    
    const { streams } = req.body; // Espera um array de objetos de stream { name, url, group, ... }

    if (!streams || !Array.isArray(streams) || streams.length === 0) {
        return res.status(400).json({ message: 'A lista de streams é obrigatória e não pode estar vazia.' });
    }

    try {
        // Encontrar ou criar a playlist mestra
        let masterPlaylist = await prisma.playlist.findFirst({
            where: { name: MASTER_PLAYLIST_NAME },
        });

        if (!masterPlaylist) {
            masterPlaylist = await prisma.playlist.create({
                data: {
                    name: MASTER_PLAYLIST_NAME,
                    priority: 1, // Prioridade alta para a playlist mestra
                    ownerId: req.user.id, // Associa ao usuário logado
                    status: 'ONLINE',
                },
            });
        }

        // Mapear os streams recebidos para o formato do schema do Prisma
        const streamsToCreate = streams.map(item => ({
            name: item.name || 'Sem Nome',
            streamUrl: item.url,
            streamType: item.streamType || 'CANAL', // Adiciona o tipo de stream
            playlistId: masterPlaylist.id,
        }));

        // Adicionar os novos streams ao banco de dados
        const creationResult = await prisma.stream.createMany({
            data: streamsToCreate,
            skipDuplicates: true, // Previne erros se houver duplicatas na própria lista enviada
        });

        // Invalida a cache da playlist mestra para que o worker a re-processe se necessário
        playlistCache.del(`playlist_${masterPlaylist.id}`);
        await prisma.playlist.update({
            where: { id: masterPlaylist.id },
            data: { status: 'ONLINE' }, // Define como online pois foi atualizada manualmente
        });

        // Atualiza as contagens do dashboard
        // Se dashboardService não estiver disponível, esta linha pode ser comentada ou removida
        // dashboardService.updateContentCounts();

        res.status(201).json({ message: `Operação concluída. ${creationResult.count} novos streams foram adicionados à Master Playlist.` });

    } catch (error) {
        console.error("Erro durante createMasterPlaylistFromParsed:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor.' });
    }
};

// @desc    Analisa o conteúdo M3U fornecido em texto para encontrar novos streams e duplicatas
// @route   POST /api/playlists/analyze
const analyzeM3uContent = async (req, res) => {
    const { m3uContent } = req.body;

    if (!m3uContent) {
        return res.status(400).json({ message: 'O conteúdo M3U é obrigatório.' });
    }

    try {
        const analysisResult = await analyzeM3uString(m3uContent);
        res.status(200).json(analysisResult);
    } catch (error) {
        console.error("Erro durante a análise do conteúdo M3U:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor ao analisar o conteúdo.' });
    }
};

// @desc    Atualiza o tipo de um stream (CANAL, FILME, SERIE)
// @route   PUT /api/playlists/master/streams/:id/type
const updateStreamType = async (req, res) => {
    const { id } = req.params;
    const { streamType } = req.body;

    // Validação para garantir que o tipo é um dos valores permitidos pelo Enum
    if (!['CANAL', 'FILME', 'SERIE'].includes(streamType)) {
        return res.status(400).json({ message: 'Tipo de stream inválido.' });
    }

    try {
        const updatedStream = await prisma.stream.update({
            where: { id: parseInt(id) },
            data: { streamType },
        });

        // Opcional: invalidar caches se houver
        const masterPlaylist = await prisma.playlist.findFirst({
            where: { id: updatedStream.playlistId },
        });
        if (masterPlaylist) {
            playlistCache.del(`playlist_${masterPlaylist.id}`);
        }

        res.status(200).json(updatedStream);
    } catch (error) {
        console.error(`Erro ao atualizar o tipo do stream ${id}:`, error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Gets the content of the master playlist text file
// @route   GET /api/playlists/master-text
const getMasterPlaylistText = async (req, res) => {
    const MASTER_PLAYLIST_PATH = path.join(__dirname, '../../master_playlist.txt');
    try {
        const content = await fsPromises.readFile(MASTER_PLAYLIST_PATH, 'utf-8');
        res.status(200).send(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, which is fine, just return empty content
            return res.status(200).send('');
        }
        console.error("Error reading master playlist text file:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

// @desc    Updates the content of the master playlist text file
// @route   PUT /api/playlists/master-text
const updateMasterPlaylistText = async (req, res) => {
    const MASTER_PLAYLIST_PATH = path.join(__dirname, '../../master_playlist.txt');
    const { content } = req.body;

    if (content === undefined) {
        return res.status(400).json({ message: 'Content is required.' });
    }

    // Validation logic
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('#EXTINF') && !line.includes('tvg-logo')) {
            return res.status(400).json({ message: `A linha "${line}" não contém "tvg-logo".` });
        }
    }

    try {
        await fsPromises.writeFile(MASTER_PLAYLIST_PATH, content, 'utf-8');
        res.status(200).json({ message: 'Master playlist updated successfully.' });
    } catch (error) {
        console.error("Error writing to master playlist text file:", error);
        res.status(500).json({ message: 'Erro Interno do Servidor' });
    }
};

module.exports = {
    getM3uFilesContent,
    synchronizeMasterPlaylist,
    getMasterPlaylistStreams,
    addMasterPlaylistStream,
    updateMasterPlaylistStream,
    deleteMasterPlaylistStream,
    deletePlaylist,
    refreshPlaylistStatus,
    generateClientPlaylist,
    analyzeM3uContent, // Adicionado aqui
    createMasterPlaylistFromParsed, // Adicionado para a Fase 2
    updateStreamType,
    getMasterPlaylistText,
    updateMasterPlaylistText,
};
