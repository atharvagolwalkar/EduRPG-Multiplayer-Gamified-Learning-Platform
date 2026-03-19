'use client';
import { useEffect } from 'react';
import { useGameStore } from '../lib/store';

export default function AuthBootstrap() {
  const loadPersistedUser = useGameStore((s) => s.loadPersistedUser);
  useEffect(() => { loadPersistedUser(); }, [loadPersistedUser]);
  return null;
}