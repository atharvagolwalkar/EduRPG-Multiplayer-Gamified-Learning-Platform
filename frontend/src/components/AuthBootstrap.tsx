'use client';
import { useEffect } from 'react';
import { useStore } from '../lib/store';

export default function AuthBootstrap() {
  const loadPersistedUser = useStore((s) => s.loadPersistedUser);
  useEffect(() => { loadPersistedUser(); }, [loadPersistedUser]);
  return null;
}