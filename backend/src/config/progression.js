export const SKILL_TREES = {
  mage: [
    { id: 'mage-hint-spell', label: 'Hint Spell', requirement: { level: 1 } },
    { id: 'mage-arcane-chain', label: 'Arcane Chain', requirement: { level: 3, subject: 'mathematics', score: 65 } },
    { id: 'mage-proof-surge', label: 'Proof Surge', requirement: { level: 5, subject: 'mathematics', score: 80 } },
  ],
  engineer: [
    { id: 'engineer-shield', label: 'Shield Matrix', requirement: { level: 1 } },
    { id: 'engineer-refactor', label: 'Refactor Burst', requirement: { level: 3, subject: 'programming', score: 65 } },
    { id: 'engineer-compile-overdrive', label: 'Compile Overdrive', requirement: { level: 5, subject: 'programming', score: 80 } },
  ],
  scientist: [
    { id: 'scientist-analyze', label: 'Analyze', requirement: { level: 1 } },
    { id: 'scientist-vector-lens', label: 'Vector Lens', requirement: { level: 3, subject: 'physics', score: 65 } },
    { id: 'scientist-theory-breakthrough', label: 'Theory Breakthrough', requirement: { level: 5, subject: 'physics', score: 80 } },
  ],
};

export const SUBJECT_KEYS = ['mathematics', 'programming', 'physics', 'general'];

export function createInitialProgression(heroClass) {
  const mastery = {
    mathematics: {},
    programming: {},
    physics: {},
    general: {},
  };

  return {
    mastery,
    unlockedSkills: SKILL_TREES[heroClass]
      .filter((skill) => skill.requirement.level <= 1)
      .map((skill) => skill.id),
    progressionHistory: [],
  };
}

export function updateMasteryBucket(bucket = {}, concept, isCorrect) {
  const current = bucket[concept] || { attempts: 0, correct: 0, masteryScore: 0 };
  const attempts = current.attempts + 1;
  const correct = current.correct + (isCorrect ? 1 : 0);
  const masteryScore = Math.round((correct / attempts) * 100);

  return {
    ...bucket,
    [concept]: {
      attempts,
      correct,
      masteryScore,
    },
  };
}

export function getSubjectMasteryAverage(subjectMastery = {}) {
  const entries = Object.values(subjectMastery);
  if (entries.length === 0) {
    return 0;
  }

  const total = entries.reduce((sum, entry) => sum + (entry.masteryScore || 0), 0);
  return Math.round(total / entries.length);
}

export function computeUnlockedSkills(heroClass, level, mastery) {
  const skills = SKILL_TREES[heroClass] || [];

  return skills
    .filter((skill) => {
      if (level < skill.requirement.level) {
        return false;
      }

      if (!skill.requirement.subject) {
        return true;
      }

      const score = getSubjectMasteryAverage(mastery?.[skill.requirement.subject]);
      return score >= (skill.requirement.score || 0);
    })
    .map((skill) => skill.id);
}
