export const SKILL_TREES = {
  mage: [
    { id: 'mage-hint-spell', label: 'Hint Spell', requirement: { level: 1 } },
    { id: 'mage-arcane-chain', label: 'Arcane Chain', requirement: { level: 3, subject: 'mathematics', score: 65 } },
    { id: 'mage-proof-surge', label: 'Proof Surge', requirement: { level: 5, subject: 'mathematics', score: 80 } },
    { id: 'mage-equation-mastery', label: 'Equation Mastery', requirement: { level: 8, subject: 'mathematics', score: 90 } },
  ],
  engineer: [
    { id: 'engineer-shield', label: 'Shield Matrix', requirement: { level: 1 } },
    { id: 'engineer-refactor', label: 'Refactor Burst', requirement: { level: 3, subject: 'programming', score: 65 } },
    { id: 'engineer-compile-overdrive', label: 'Compile Overdrive', requirement: { level: 5, subject: 'programming', score: 80 } },
    { id: 'engineer-debug-godmode', label: 'Debug Godmode', requirement: { level: 8, subject: 'programming', score: 90 } },
  ],
  scientist: [
    { id: 'scientist-analyze', label: 'Analyze', requirement: { level: 1 } },
    { id: 'scientist-vector-lens', label: 'Vector Lens', requirement: { level: 3, subject: 'physics', score: 65 } },
    { id: 'scientist-theory-breakthrough', label: 'Theory Breakthrough', requirement: { level: 5, subject: 'physics', score: 80 } },
    { id: 'scientist-quantum-leap', label: 'Quantum Leap', requirement: { level: 8, subject: 'physics', score: 90 } },
  ],
  alchemist: [
    { id: 'alchemist-potion-brew', label: 'Potion Brew', requirement: { level: 1 } },
    { id: 'alchemist-reaction-chain', label: 'Reaction Chain', requirement: { level: 3, subject: 'chemistry', score: 65 } },
    { id: 'alchemist-acid-surge', label: 'Acid Surge', requirement: { level: 5, subject: 'chemistry', score: 80 } },
    { id: 'alchemist-elixir-master', label: 'Elixir Master', requirement: { level: 8, subject: 'chemistry', score: 90 } },
  ],
  historian: [
    { id: 'historian-timeline-vision', label: 'Timeline Vision', requirement: { level: 1 } },
    { id: 'historian-event-link', label: 'Event Link', requirement: { level: 3, subject: 'history', score: 65 } },
    { id: 'historian-causality-chain', label: 'Causality Chain', requirement: { level: 5, subject: 'history', score: 80 } },
    { id: 'historian-epoch-mastery', label: 'Epoch Mastery', requirement: { level: 8, subject: 'history', score: 90 } },
  ],
  bard: [
    { id: 'bard-inspiration-anthem', label: 'Inspiration Anthem', requirement: { level: 1 } },
    { id: 'bard-story-weave', label: 'Story Weave', requirement: { level: 3, subject: 'literature', score: 65 } },
    { id: 'bard-legend-recall', label: 'Legend Recall', requirement: { level: 5, subject: 'literature', score: 80 } },
    { id: 'bard-epic-saga', label: 'Epic Saga', requirement: { level: 8, subject: 'literature', score: 90 } },
  ],
  warrior: [
    { id: 'warrior-logic-strike', label: 'Logic Strike', requirement: { level: 1 } },
    { id: 'warrior-strategy-maneuver', label: 'Strategy Maneuver', requirement: { level: 3, subject: 'logic', score: 65 } },
    { id: 'warrior-tactics-overload', label: 'Tactics Overload', requirement: { level: 5, subject: 'logic', score: 80 } },
    { id: 'warrior-philosophy-command', label: 'Philosophy Command', requirement: { level: 8, subject: 'logic', score: 90 } },
  ],
  druid: [
    { id: 'druid-nature-sense', label: 'Nature Sense', requirement: { level: 1 } },
    { id: 'druid-ecosystem-balance', label: 'Ecosystem Balance', requirement: { level: 3, subject: 'biology', score: 65 } },
    { id: 'druid-genetic-weave', label: 'Genetic Weave', requirement: { level: 5, subject: 'biology', score: 80 } },
    { id: 'druid-evolution-command', label: 'Evolution Command', requirement: { level: 8, subject: 'biology', score: 90 } },
  ],
};


export const SUBJECT_KEYS = ['mathematics', 'programming', 'physics', 'chemistry', 'history', 'literature', 'biology', 'logic', 'general'];

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
