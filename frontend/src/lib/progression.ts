import type { HeroClass, UserRecord } from './useAPI';

export const SKILL_TREES: Record<HeroClass, Array<{ id: string; label: string }>> = {
  mage: [
    { id: 'mage-hint-spell', label: 'Hint Spell' },
    { id: 'mage-arcane-chain', label: 'Arcane Chain' },
    { id: 'mage-proof-surge', label: 'Proof Surge' },
  ],
  engineer: [
    { id: 'engineer-shield', label: 'Shield Matrix' },
    { id: 'engineer-refactor', label: 'Refactor Burst' },
    { id: 'engineer-compile-overdrive', label: 'Compile Overdrive' },
  ],
  scientist: [
    { id: 'scientist-analyze', label: 'Analyze' },
    { id: 'scientist-vector-lens', label: 'Vector Lens' },
    { id: 'scientist-theory-breakthrough', label: 'Theory Breakthrough' },
  ],
};

export function getMasterySummary(user: Pick<UserRecord, 'progression'> | null) {
  const mastery = user?.progression?.mastery || {};

  const summarize = (bucket?: Record<string, { masteryScore: number }>) => {
    const entries = Object.values(bucket || {});
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((sum, entry) => sum + entry.masteryScore, 0) / entries.length);
  };

  return {
    mathematics: summarize(mastery.mathematics),
    programming: summarize(mastery.programming),
    physics: summarize(mastery.physics),
    general: summarize(mastery.general),
  };
}
