// const serverRoutes = require('./routes/serverRoutes');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const tokenRoutes = require('./routes/tokenRoutes'); // Import token routes
const clientRoutes = require('./routes/clientRoutes'); // Import client routes
const dashboardRoutes = require('./routes/dashboardRoutes'); // Import dashboard routes
const serverRoutes = require('./routes/serverRoutes');
const sourcePlaylistRoutes = require('./routes/sourcePlaylistRoutes'); // Import source playlist routes
// const backgroundWorker = require('./services/backgroundWorker'); // N�o importamos mais aqui

const app = express();

app.use(cors());
// Corre��o: Aumentamos o limite para lidar com uploads de 100MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/tokens', tokenRoutes); // Use token routes
app.use('/api/clients', clientRoutes); // Use client routes
app.use('/api/dashboard', dashboardRoutes); // Use dashboard routes
app.use('/api/server', serverRoutes);
app.use('/api/source-playlists', sourcePlaylistRoutes); // Use source playlist routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'FastPanel API is running!' });
});

app.get('/', (req, res) => {
    res.send('FastPanel API is running!');
});

// Generic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // CORRE��O FINAL: REMOVEMOS A CHAMADA DO WORKER DAQUI!
    // Ele ser� iniciado separadamente pelo PM2 como um processo isolado,
    // garantindo que ele n�o derrube a API principal com o parsing de 100MB.
    // backgroundWorker.start(); 
});
