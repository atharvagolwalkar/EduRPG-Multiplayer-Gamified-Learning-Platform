'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
export default function Bootstrap() {
  const load = useStore(s => s.loadPersistedUser);
  useEffect(() => { load(); }, [load]);
  return null;
}