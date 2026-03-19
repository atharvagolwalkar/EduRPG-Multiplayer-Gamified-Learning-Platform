'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getRaidSocket } from './socket';
import type { Socket } from 'socket.io-client';

interface Player {
  id: string;
  username?: string;
  guildId?: string;
}

export function useMultiplayerRaid(raidId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getRaidSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const joinRaid = useCallback((player: Player) => {
    if (!socketRef.current || !raidId) return;
    socketRef.current.emit('raid:join', { raidId, player });
  }, [raidId]);

  const submitAnswer = useCallback(
    (isCorrect: boolean, baseDamage: number, streak: number, subject: string, concept: string) => {
      if (!socketRef.current || !raidId) return;
      socketRef.current.emit('raid:answer', {
        raidId,
        isCorrect,
        baseDamage,
        streak,
        subject,
        concept,
      });
    },
    [raidId]
  );

  return {
    socket: socketRef.current,
    connected,
    joinRaid,
    submitAnswer,
  };
}