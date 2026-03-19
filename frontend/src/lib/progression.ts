import type { AppUser } from './store';

export type MasterySummary = {
  mathematics: number;
  programming: number;
  physics: number;
  general: number;
};

/**
 * Derive a 0-100 mastery score per subject from the user's progression data.
 * Falls back to 0 if the field doesn't exist (common for newly created users).
 */
export function getMasterySummary(user: AppUser & { progression?: any }): MasterySummary {
  const mastery = (user as any).progression?.mastery || {};

  function bucketToScore(bucket: Record<string, { correct: number; total: number }> | undefined): number {
    if (!bucket) return 0;
    const entries = Object.values(bucket);
    if (entries.length === 0) return 0;
    const total = entries.reduce((s, b) => s + (b.total || 0), 0);
    const correct = entries.reduce((s, b) => s + (b.correct || 0), 0);
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  }

  return {
    mathematics: bucketToScore(mastery.mathematics),
    programming: bucketToScore(mastery.programming),
    physics: bucketToScore(mastery.physics),
    general: bucketToScore(mastery.general),
  };
}