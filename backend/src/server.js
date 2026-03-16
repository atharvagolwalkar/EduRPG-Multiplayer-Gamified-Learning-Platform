import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket.js';
import { setupMultiplayerWebSocket } from './multiplaya-websocket.js';
import { setupFirebaseRoutes } from './routes/firebaseRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EduRPG Backend Running',
    firebase: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP Server for WebSocket
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Setup WebSocket namespaces
setupWebSocket(io);
setupMultiplayerWebSocket(io);

// Setup Firebase Routes
setupFirebaseRoutes(app);

// Simple API Routes (backward compatibility)
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  // Mock registration
  res.json({
    success: true,
    message: 'User registered',
    user: { id: Math.random(), username, email },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Mock login
  res.json({
    success: true,
    token: 'mock_jwt_token',
    user: { id: Math.random(), username },
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json({
    leaderboard: [
      { rank: 1, username: 'Player1', xp: 5000 },
      { rank: 2, username: 'Player2', xp: 4500 },
      { rank: 3, username: 'Player3', xp: 4000 },
    ],
  });
});

// Start Server
server.listen(port, () => {
  console.log(`
    ╔════════════════════════════════════╗
    ║   🚀 EduRPG Backend Running        ║
    ║   Port: ${port}                      ║
    ║   WebSocket: Active                ║
    ║   Firebase: Connected              ║
    ║   API: Ready                       ║
    ╚════════════════════════════════════╝
  `);
  console.log(`
    📡 WebSocket Namespaces:
    • /raids (multiplayer raids)
    • / (general events)
    
    📚 API Routes:
    • POST /api/users/create
    • GET /api/users/:userId
    • POST /api/raids/start
    • GET /api/leaderboard/global
    • POST /api/guilds/create
    • GET /api/guilds
  `);
});

export default app;
