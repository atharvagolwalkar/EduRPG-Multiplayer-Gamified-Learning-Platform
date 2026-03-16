import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useCallback, useState } from 'react';

let socketInstance: Socket | null = null;

export const useMultiplayerRaid = (raidId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!raidId) return;

    if (!socketRef.current) {
      socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}/raids`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        console.log('🎮 Connected to raid WebSocket');
        setConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🎮 Disconnected from raid WebSocket');
        setConnected(false);
      });

      socketRef.current.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [raidId]);

  const joinRaid = useCallback((player: any) => {
    if (socketRef.current && raidId) {
      socketRef.current.emit('raid:join', { raidId, player });
    }
  }, [raidId]);

  const submitAnswer = useCallback((isCorrect: boolean, damage: number, streak: number) => {
    if (socketRef.current && raidId) {
      socketRef.current.emit('raid:answer', {
        raidId,
        isCorrect,
        damage,
        streak,
      });
    }
  }, [raidId]);

  const onPlayerJoined = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:player-joined', callback);
    }
  }, []);

  const onDamage = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:damage', callback);
    }
  }, []);

  const onRaidEnd = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:end', callback);
    }
  }, []);

  const onPlayerLeft = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:player-left', callback);
    }
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

  useEffect(() => {
    if (!raidId) return;

    if (!socketRef.current) {
      socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}/raids`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        console.log('🎮 Connected to raid WebSocket');
        setConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🎮 Disconnected from raid WebSocket');
        setConnected(false);
      });

      socketRef.current.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [raidId]);

  const joinRaid = useCallback((player: any) => {
    if (socketRef.current && raidId) {
      socketRef.current.emit('raid:join', { raidId, player });
    }
  }, [raidId]);

  const submitAnswer = useCallback((isCorrect: boolean, damage: number, streak: number) => {
    if (socketRef.current && raidId) {
      socketRef.current.emit('raid:answer', {
        raidId,
        isCorrect,
        damage,
        streak,
      });
    }
  }, [raidId]);

  const onPlayerJoined = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:player-joined', callback);
    }
  }, []);

  const onDamage = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:damage', callback);
    }
  }, []);

  const onRaidEnd = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:end', callback);
    }
  }, []);

  const onPlayerLeft = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('raid:player-left', callback);
    }
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
