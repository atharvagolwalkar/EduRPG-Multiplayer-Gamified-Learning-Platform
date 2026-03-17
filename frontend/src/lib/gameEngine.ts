export interface Question {
  id: string;
  body: string;
  options: string[];
  correctIndex: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  subject: 'mathematics' | 'programming' | 'physics' | 'general';
  concept: string;
  explanation: string;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  topic: string;
}

export interface BattleResult {
  isCorrect: boolean;
  damage: number;
  isCritical: boolean;
  xpGained: number;
  streakBonus: number;
}

export const HERO_STATS = {
  mage: { attackPower: 30, defense: 8, maxHp: 90, skill: 'hint_spell', subject: 'mathematics' },
  engineer: { attackPower: 25, defense: 15, maxHp: 110, skill: 'shield', subject: 'programming' },
  scientist: { attackPower: 22, defense: 12, maxHp: 100, skill: 'analyze', subject: 'physics' },
} as const;

const QUESTION_BANK: Question[] = [
  {
    id: 'math-1',
    body: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    difficulty: 1,
    subject: 'mathematics',
    concept: 'arithmetic',
    explanation: 'Adding 2 and 2 gives 4.',
  },
  {
    id: 'math-2',
    body: 'What is the derivative of x^2?',
    options: ['x', '2x', 'x^3', '2'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'mathematics',
    concept: 'calculus',
    explanation: 'The derivative of x^2 with respect to x is 2x.',
  },
  {
    id: 'prog-1',
    body: 'What does let do in JavaScript?',
    options: ['Declares a block-scoped variable', 'Defines a constant', 'Creates a function', 'Imports a module'],
    correctIndex: 0,
    difficulty: 2,
    subject: 'programming',
    concept: 'javascript-basics',
    explanation: 'let declares a variable whose scope is limited to the block.',
  },
  {
    id: 'prog-2',
    body: 'Which data structure follows FIFO order?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'programming',
    concept: 'data-structures',
    explanation: 'Queues process items in first-in, first-out order.',
  },
  {
    id: 'phys-1',
    body: 'What is the SI unit of force?',
    options: ['Joule', 'Pascal', 'Newton', 'Watt'],
    correctIndex: 2,
    difficulty: 1,
    subject: 'physics',
    concept: 'mechanics',
    explanation: 'Force is measured in newtons.',
  },
  {
    id: 'phys-2',
    body: 'If velocity changes over time, what quantity is present?',
    options: ['Acceleration', 'Mass', 'Momentum', 'Voltage'],
    correctIndex: 0,
    difficulty: 2,
    subject: 'physics',
    concept: 'kinematics',
    explanation: 'Acceleration measures the rate of change of velocity.',
  },
];

export const calculateDamage = (
  heroClass: 'mage' | 'engineer' | 'scientist',
  isCorrect: boolean,
  streak: number
): BattleResult => {
  const heroStats = HERO_STATS[heroClass];
  let baseDamage: number = heroStats.attackPower;
  const isCritical = Math.random() < 0.15;

  if (isCritical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  const streakMultiplier = 1 + Math.min(streak * 0.1, 2);
  baseDamage = Math.floor(baseDamage * streakMultiplier);

  const xpGained = isCorrect ? 10 + (isCritical ? 5 : 0) : 0;
  const streakBonus = isCorrect ? (streak >= 3 ? 5 : 0) : 0;

  return {
    isCorrect,
    damage: baseDamage,
    isCritical,
    xpGained,
    streakBonus,
  };
};

export const generateMockQuestions = (
  targetDifficulty: number,
  preferredSubject?: Question['subject']
): Question[] => {
  const relevantQuestions = QUESTION_BANK.filter(
    (question) =>
      question.difficulty <= targetDifficulty + 1 &&
      (!preferredSubject || question.subject === preferredSubject || question.subject === 'general')
  );

  return relevantQuestions.length > 0 ? relevantQuestions : QUESTION_BANK.slice(0, 3);
};

export const getAdaptiveDifficulty = (masteryScore = 0, level = 1) => {
  if (masteryScore >= 80 || level >= 5) return 4;
  if (masteryScore >= 65 || level >= 3) return 3;
  if (masteryScore >= 40 || level >= 2) return 2;
  return 1;
};

export const getQuestionBank = () => QUESTION_BANK;
