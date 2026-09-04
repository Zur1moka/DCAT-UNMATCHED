require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 5000;

// ===== CORS =====
app.use(cors({
  origin: "*",  // Cho phép mọi domain (có thể thay bằng domain cụ thể sau)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matches');
const heroRoutes = require('./routes/heroRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const questRoutes = require('./routes/questRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/heroes', heroRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Unmatched API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===== WebSocket CORS =====
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // Hoặc domain cụ thể
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`🔌 WebSocket ready`);
});