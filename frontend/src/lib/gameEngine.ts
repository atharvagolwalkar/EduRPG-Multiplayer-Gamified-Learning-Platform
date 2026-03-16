export interface Question {
  id: string;
  body: string;
  options: string[];
  correctIndex: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
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
  mage: { attackPower: 30, defense: 8, maxHp: 90, skill: 'hint_spell' },
  engineer: { attackPower: 25, defense: 15, maxHp: 110, skill: 'shield' },
  scientist: { attackPower: 22, defense: 12, maxHp: 100, skill: 'analyze' },
};

export const calculateDamage = (
  heroClass: 'mage' | 'engineer' | 'scientist',
  isCorrect: boolean,
  streak: number
): BattleResult => {
  const heroStats = HERO_STATS[heroClass];
  let baseDamage = heroStats.attackPower;
  const isCritical = Math.random() < 0.15; // 15% crit chance

  if (isCritical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // Streak bonus (up to 3x at 10-streak)
  const streakMultiplier = 1 + Math.min(streak * 0.1, 2); // Max 3x
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

export const generateMockQuestions = (difficulty: number): Question[] => {
  const questions: Question[] = [
    {
      id: '1',
      body: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      difficulty: 1,
    },
    {
      id: '2',
      body: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Rome'],
      correctIndex: 2,
      difficulty: 1,
    },
    {
      id: '3',
      body: 'What does "let" do in JavaScript?',
      options: [
        'Allows variable',
        'Defines constant',
        'Creates function',
        'Imports module',
      ],
      correctIndex: 0,
      difficulty: 2,
    },
  ];

  return questions.filter((q) => q.difficulty <= difficulty);
};
