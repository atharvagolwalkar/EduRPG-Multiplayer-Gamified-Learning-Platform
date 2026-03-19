import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket.js';
import { setupMultiplayerWebSocket } from './multiplaya-websocket.js';
import { setupFirebaseRoutes } from './routes/firebaseRoutes.js';
import admin from 'firebase-admin';
import { firebaseConfigSource, isMockFirebase } from './firebase.js';
import { generateDungeonMasterBeat } from './services/DungeonMasterService.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public health check
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

app.get('/api/system/firebase-test', async (req, res) => {
  try {
    if (isMockFirebase) {
      return res.json({
        success: false,
        message: 'Firebase running in MOCK mode - data will not persist to Firestore',
        mode: 'mock',
        recommendation: 'Set up Firebase service account credentials. See FIREBASE_SETUP.md'
      });
    }

    // Try a quick write/read test
    const testId = `test-${Date.now()}`;
    const testData = { testId, timestamp: new Date().toISOString() };
    
    // Write test
    await admin.firestore().collection('_system_tests').doc(testId).set(testData);
    
    // Read test
    const doc = await admin.firestore().collection('_system_tests').doc(testId).get();
    
    // Cleanup
    await admin.firestore().collection('_system_tests').doc(testId).delete();

    if (doc.exists) {
      res.json({
        success: true,
        message: 'Firebase is connected and working! Read/write test passed.',
        mode: 'connected',
        configSource: firebaseConfigSource,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Firebase write test passed but read failed - check collection permissions',
        mode: 'connected',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase write/read test failed: ' + error.message,
      mode: isMockFirebase ? 'mock' : 'connected',
      suggestion: 'Check Firebase credentials and ensure Firestore database is accessible'
    });
  }
});

// Public AI endpoint (DM narration doesn't need auth)
app.post('/api/ai/dungeon-master', async (req, res) => {
  try {
    const beat = await generateDungeonMasterBeat(req.body || {});
    res.json({ success: true, beat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
  if (isMockFirebase) {
    req.user = { uid: 'mock-user-id', email: 'mock@test.com', username: 'MockUser' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Missing or invalid token' });
  }

  try {
    const idToken = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Setup routes AFTER auth middleware for protected ones
setupWebSocket(io);
setupMultiplayerWebSocket(io);

// Apply auth middleware to protected paths (all /api/* except /api/auth, /api/ai, /health)
app.use('/api/users', authMiddleware);
app.use('/api/raids', authMiddleware);
app.use('/api/guilds', authMiddleware);
app.use('/api/leaderboard', authMiddleware);

// Public routes already in firebaseRoutes
setupFirebaseRoutes(app);

// Remove old leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.redirect('/api/leaderboard/global');
});
//   const { username, email } = req.body;
//
//   res.json({
//     success: true,
//     message: 'User registered',
//     user: { id: Math.random(), username, email },
//   });
// });
//
// app.post('/api/auth/login', (req, res) => {
//   const { username } = req.body;
//
//   res.json({
//     success: true,
//     token: 'mock_jwt_token',
//     user: { id: Math.random(), username },
//   });
// });

server.listen(port, () => {
  console.log(`EduRPG backend running on port ${port}`);
  console.log(`Firebase mode: ${isMockFirebase ? 'mock development store' : 'connected'}`);
  console.log(`Firebase config source: ${firebaseConfigSource}`);
  console.log('WebSocket namespaces: /raids, /');
  console.log('API routes: /api/users/create, /api/raids/start, /api/leaderboard/global, /api/guilds/create');
});

export default app;
