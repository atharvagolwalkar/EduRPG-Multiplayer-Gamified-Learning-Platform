"use client";

import { useEffect } from 'react';
import { useGameStore } from '../lib/store';

export default function AuthBootstrap() {
  const loadPersistedUser = useGameStore((state) => state.loadPersistedUser);

  useEffect(() => {
    loadPersistedUser();
  }, [loadPersistedUser]);

  return null;
}