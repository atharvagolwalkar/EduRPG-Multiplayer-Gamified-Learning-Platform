import { io, Socket } from 'socket.io-client';
import { useCallback, useEffect, useRef, useState } from 'react';

type RaidPlayer = {
  id: string;
  username?: string;
};

type RaidEventPayload = Record<string, unknown>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useMultiplayerRaid = (raidId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!raidId) {
      return undefined;
    }

    socketRef.current = io(`${API_URL}/raids`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to raid WebSocket');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from raid WebSocket');
      setConnected(false);
    });

    socketRef.current.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [raidId]);

  const joinRaid = useCallback(
    (player: RaidPlayer) => {
      if (socketRef.current && raidId) {
        socketRef.current.emit('raid:join', { raidId, player });
      }
    },
    [raidId]
  );

  const submitAnswer = useCallback(
    (isCorrect: boolean, damage: number, streak: number) => {
      if (socketRef.current && raidId) {
        socketRef.current.emit('raid:answer', {
          raidId,
          isCorrect,
          damage,
          streak,
        });
      }
    },
    [raidId]
  );

  const onPlayerJoined = useCallback((callback: (data: RaidEventPayload) => void) => {
    socketRef.current?.on('raid:player-joined', callback);
  }, []);

  const onDamage = useCallback((callback: (data: RaidEventPayload) => void) => {
    socketRef.current?.on('raid:damage', callback);
  }, []);

  const onRaidEnd = useCallback((callback: (data: RaidEventPayload) => void) => {
    socketRef.current?.on('raid:end', callback);
  }, []);

  const onPlayerLeft = useCallback((callback: (data: RaidEventPayload) => void) => {
    socketRef.current?.on('raid:player-left', callback);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    joinRaid,
    submitAnswer,
    onPlayerJoined,
    onDamage,
    onRaidEnd,
    onPlayerLeft,
  };
};
