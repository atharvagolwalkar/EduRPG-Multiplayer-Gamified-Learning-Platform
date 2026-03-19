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
  // Mathematics (Difficulty 1-2)
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
    body: 'What is 10 - 3?',
    options: ['6', '7', '8', '9'],
    correctIndex: 1,
    difficulty: 1,
    subject: 'mathematics',
    concept: 'arithmetic',
    explanation: 'Subtracting 3 from 10 gives 7.',
  },
  {
    id: 'math-3',
    body: 'What is 4 × 5?',
    options: ['20', '19', '21', '25'],
    correctIndex: 0,
    difficulty: 1,
    subject: 'mathematics',
    concept: 'arithmetic',
    explanation: 'Multiplying 4 by 5 gives 20.',
  },
  {
    id: 'math-4',
    body: 'Solve for x: 2x + 3 = 11',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'mathematics',
    concept: 'algebra',
    explanation: 'Subtract 3 from both sides: 2x = 8, then x = 4.',
  },
  {
    id: 'math-5',
    body: 'What is 25% of 80?',
    options: ['15', '20', '25', '30'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'mathematics',
    concept: 'percentages',
    explanation: '25% = 1/4, so 80/4 = 20.',
  },
  {
    id: 'math-6',
    body: 'What is √16?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'mathematics',
    concept: 'roots',
    explanation: 'The square root of 16 is 4 because 4 × 4 = 16.',
  },
  // Mathematics (Difficulty 3-5) 
  {
    id: 'math-7',
    body: 'What is the derivative of x^2?',
    options: ['x', '2x', 'x^3', '2'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'mathematics',
    concept: 'calculus',
    explanation: 'The derivative of x^2 with respect to x is 2x.',
  },
  {
    id: 'math-8',
    body: 'What is the integral of 2x dx?',
    options: ['x + C', 'x^2 + C', '2 + C', '2x^2 + C'],
    correctIndex: 1,
    difficulty: 4,
    subject: 'mathematics',
    concept: 'calculus',
    explanation: 'The integral of 2x is x^2 + C.',
  },
  {
    id: 'math-9',
    body: 'Expand (x + 2)^2?',
    options: ['x^2 + 4', 'x^2 + 4x + 4', 'x^2 - 4x + 4', 'x^2 + 2x + 4'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'mathematics',
    concept: 'binomial',
    explanation: '(x + 2)^2 = x^2 + 4x + 4 using FOIL method.',
  },
  {
    id: 'math-10',
    body: 'What is Log10(100)?',
    options: ['1', '2', '3', '10'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'mathematics',
    concept: 'logarithms',
    explanation: 'Log10(100) = 2 because 10^2 = 100.',
  },
  // Programming (Difficulty 1-2)
  {
    id: 'prog-1',
    body: 'What does let do in JavaScript?',
    options: ['Declares a block-scoped variable', 'Defines a constant', 'Creates a function', 'Imports a module'],
    correctIndex: 0,
    difficulty: 1,
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
    id: 'prog-3',
    body: 'What does console.log do?',
    options: ['Logs to the browser console', 'Prints to file', 'Sends email', 'Executes code'],
    correctIndex: 0,
    difficulty: 1,
    subject: 'programming',
    concept: 'javascript-basics',
    explanation: 'console.log outputs text to the browser development console for debugging.',
  },
  {
    id: 'prog-4',
    body: 'How do you declare a function in JavaScript?',
    options: ['function myFunc()', 'def myFunc():', 'func myFunc()', 'define myFunc()'],
    correctIndex: 0,
    difficulty: 1,
    subject: 'programming',
    concept: 'functions',
    explanation: 'Use the function keyword followed by function name and parentheses.',
  },
  {
    id: 'prog-5',
    body: 'What is a closure?',
    options: ['An error in code', 'A function with access to outer scope variables', 'A loop', 'A data type'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'programming',
    concept: 'advanced-concepts',
    explanation: 'A closure is a function that has access to variables from its outer (enclosing) scope.',
  },
  {
    id: 'prog-6',
    body: 'What is the difference between == and ===?',
    options: ['No difference', '== allows type coercion, === requires strict equality', '=== is deprecated', '== is faster'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'programming',
    concept: 'operators',
    explanation: '== compares values with type conversion, === compares exact values and types.',
  },
  {
    id: 'prog-7',
    body: 'What is async/await in JavaScript?',
    options: ['Loop keywords', 'Old syntax for callbacks', 'Modern way to handle promises', 'Database functions'],
    correctIndex: 2,
    difficulty: 3,
    subject: 'programming',
    concept: 'async-programming',
    explanation: 'async/await provides a cleaner way to write asynchronous code using promises.',
  },
  {
    id: 'prog-8',
    body: 'What is hoisting in JavaScript?',
    options: ['Moving code to the top', 'Declarations moved to top of scope', 'A performance issue', 'None of the above'],
    correctIndex: 1,
    difficulty: 3,
    subject: 'programming',
    concept: 'advanced-concepts',
    explanation: 'Hoisting moves function and var declarations to the top of their scope.',
  },
  // Physics (Difficulty 1-2)
  {
    id: 'phys-1',
    body: 'What is the SI unit of force?',
    options: ['Joule', 'Pascal', 'Newton', 'Watt'],
    correctIndex: 2,
    difficulty: 1,
    subject: 'physics',
    concept: 'mechanics',
    explanation: 'Force is measured in newtons (N).',
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
  {
    id: 'phys-3',
    body: 'What is the gravity acceleration on Earth?',
    options: ['5.8 m/s²', '9.8 m/s²', '19.6 m/s²', '4.9 m/s²'],
    correctIndex: 1,
    difficulty: 1,
    subject: 'physics',
    concept: 'mechanics',
    explanation: 'Earth gravity is approximately 9.8 m/s² or 10 m/s².',
  },
  {
    id: 'phys-4',
    body: 'What is Newtons second law?',
    options: ['F = ma', 'F = a/m', 'F = m/a', 'F = m + a'],
    correctIndex: 0,
    difficulty: 1,
    subject: 'physics',
    concept: 'mechanics',
    explanation: 'Force equals mass times acceleration (F = ma).',
  },
  {
    id: 'phys-5',
    body: 'What is kinetic energy?',
    options: ['E = mgh', 'E = 1/2 mv²', 'E = mc²', 'E = Fd'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'physics',
    concept: 'energy',
    explanation: 'Kinetic energy is the energy of motion, calculated as E = 1/2 mv².',
  },
  {
    id: 'phys-6',
    body: 'What is Ohms law?',
    options: ['V = IR', 'I = VR', 'R = I/V', 'V = R/I'],
    correctIndex: 0,
    difficulty: 2,
    subject: 'physics',
    concept: 'electricity',
    explanation: 'Ohms law states that Voltage = Current × Resistance (V = IR).',
  },
  {
    id: 'phys-7',
    body: 'What is Newtons third law?',
    options: ['Inertia stays same', 'Action has equal opposite reaction', 'Force equals mass times mass', 'Energy is created'],
    correctIndex: 1,
    difficulty: 2,
    subject: 'physics',
    concept: 'mechanics',
    explanation: 'For every action, there is an equal and opposite reaction.',
  },
  {
    id: 'phys-8',
    body: 'What is the speed of light?',
    options: ['300,000 m/s', '3,000,000 m/s', '30,000,000 m/s', '300,000,000 m/s'],
    correctIndex: 3,
    difficulty: 2,
    subject: 'physics',
    concept: 'waves',
    explanation: 'The speed of light is approximately 3 × 10^8 m/s or 300,000,000 m/s.',
  },
  // General (Difficulty 1-2)
  {
    id: 'gen-1',
    body: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctIndex: 2,
    difficulty: 1,
    subject: 'general',
    concept: 'geography',
    explanation: 'Paris is the capital city of France.',
  },
  {
    id: 'gen-2',
    body: 'How many sides does a triangle have?',
    options: ['2', '3', '4', '5'],
    correctIndex: 1,
    difficulty: 1,
    subject: 'general',
    concept: 'geometry',
    explanation: 'A triangle has three sides by definition.',
  },
  {
    id: 'gen-3',
    body: 'What is the largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
    correctIndex: 1,
    difficulty: 1,
    subject: 'general',
    concept: 'astronomy',
    explanation: 'Jupiter is the largest planet in our solar system.',
  },
  {
    id: 'gen-4',
    body: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    difficulty: 1,
    subject: 'general',
    concept: 'geography',
    explanation: 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.',
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
  // Normalize difficulty to 1-5 range
  const normalizedDifficulty = Math.max(1, Math.min(5, Math.round(targetDifficulty)));
  
  // Filter based on subject preference and difficulty range
  // Allow questions from current difficulty and one level above/below for variety
  const difficultyRange = {
    min: Math.max(1, normalizedDifficulty - 1),
    max: Math.min(5, normalizedDifficulty + 1),
  };

  const relevantQuestions = QUESTION_BANK.filter(
    (question) =>
      question.difficulty >= difficultyRange.min &&
      question.difficulty <= difficultyRange.max &&
      (!preferredSubject || question.subject === preferredSubject || question.subject === 'general')
  );

  // If not enough questions in difficulty range, expand to include all difficulties
  if (relevantQuestions.length < 5) {
    return QUESTION_BANK.filter(
      (question) =>
        !preferredSubject || question.subject === preferredSubject || question.subject === 'general'
    );
  }

  // Shuffle and return a balanced subset
  const shuffled = [...relevantQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(10, shuffled.length));
};

export const getAdaptiveDifficulty = (masteryScore = 0, level = 1) => {
  if (masteryScore >= 80 || level >= 5) return 4;
  if (masteryScore >= 65 || level >= 3) return 3;
  if (masteryScore >= 40 || level >= 2) return 2;
  return 1;
};

export const getQuestionBank = () => QUESTION_BANK;
