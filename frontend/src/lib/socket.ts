import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let raidSocket: Socket | null = null;

export function getRaidSocket(): Socket {
  if (!raidSocket) {
    raidSocket = io(`${API}/raids`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    raidSocket.on('connect',       () => console.log('[socket] connected', raidSocket?.id));
    raidSocket.on('disconnect',    (r) => console.log('[socket] disconnected', r));
    raidSocket.on('connect_error', (e) => console.error('[socket] error', e.message));
  }
  return raidSocket;
}