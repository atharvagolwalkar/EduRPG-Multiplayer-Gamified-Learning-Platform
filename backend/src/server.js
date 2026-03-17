import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket.js';
import { setupMultiplayerWebSocket } from './multiplaya-websocket.js';
import { setupFirebaseRoutes } from './routes/firebaseRoutes.js';
import { firebaseConfigSource, isMockFirebase } from './firebase.js';
import { generateDungeonMasterBeat } from './services/DungeonMasterService.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EduRPG Backend Running',
    firebase: isMockFirebase ? 'mock' : 'connected',
    firebaseConfigSource,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/system/firebase-status', (req, res) => {
  res.json({
    success: true,
    firebase: {
      mode: isMockFirebase ? 'mock' : 'connected',
      configSource: firebaseConfigSource,
      projectId: process.env.FIREBASE_PROJECT_ID || null,
    },
  });
});


app.post('/api/ai/dungeon-master', async (req, res) => {
  try {
    const beat = await generateDungeonMasterBeat(req.body || {});
    res.json({ success: true, beat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

setupWebSocket(io);
setupMultiplayerWebSocket(io);
setupFirebaseRoutes(app);

app.post('/api/auth/register', (req, res) => {
  const { username, email } = req.body;

  res.json({
    success: true,
    message: 'User registered',
    user: { id: Math.random(), username, email },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;

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

server.listen(port, () => {
  console.log(`EduRPG backend running on port ${port}`);
  console.log(`Firebase mode: ${isMockFirebase ? 'mock development store' : 'connected'}`);
  console.log(`Firebase config source: ${firebaseConfigSource}`);
  console.log('WebSocket namespaces: /raids, /');
  console.log('API routes: /api/users/create, /api/raids/start, /api/leaderboard/global, /api/guilds/create');
});

export default app;
