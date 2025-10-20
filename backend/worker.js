// /var/www/fastpanel/backend/worker.js

/**
 * Este � o ponto de entrada para o processo isolado (PM2 fastpanel-worker).
 * Ele inicia o processamento de cache de forma limpa.
 */
const backgroundWorker = require('./src/services/backgroundWorker'); 

console.log("Starting FastPanel Background Worker for Playlist Cache Refresh...");

// Chamada � fun��o de processamento de lista
backgroundWorker.refreshAllPlaylists()
    .then(() => {
        console.log("Initial playlist refresh completed. Worker process exiting gracefully.");
        // Sai do processo, pois o trabalho inicial terminou. 
        // O PM2 s� deve reiniciar em caso de falha futura.
        process.exit(0);
    })
    .catch((error) => {
        console.error("Worker process failed during initial run:", error);
        // N�o usamos process.exit(1) para evitar loop, mas o PM2 deve detectar a falha.
        // O restart ser� feito manualmente ou pelo PM2.
    });

// Nota: A fun��o start() em backgroundWorker.js deve ser chamada por um cronjob real se o setInterval estiver desabilitado.