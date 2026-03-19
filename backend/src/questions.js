const QUESTIONS = [
  // ── Mathematics ─────────────────────────────────────────────────────────────
  { id:'m1', subject:'mathematics', concept:'arithmetic',   difficulty:1, body:'What is 12 × 8?',                          options:['96','84','108','72'],             correct:0, explanation:'12 × 8 = 96.' },
  { id:'m2', subject:'mathematics', concept:'arithmetic',   difficulty:1, body:'What is 144 ÷ 12?',                        options:['11','12','13','14'],              correct:1, explanation:'144 ÷ 12 = 12.' },
  { id:'m3', subject:'mathematics', concept:'algebra',      difficulty:2, body:'Solve: 3x + 6 = 21',                       options:['3','4','5','6'],                  correct:2, explanation:'3x = 15 → x = 5.' },
  { id:'m4', subject:'mathematics', concept:'algebra',      difficulty:2, body:'What is 25% of 200?',                      options:['40','50','60','75'],              correct:1, explanation:'25% = ¼ → 200 ÷ 4 = 50.' },
  { id:'m5', subject:'mathematics', concept:'geometry',     difficulty:2, body:'Area of a circle with radius 7? (π≈3.14)', options:['43.96','153.86','154','44'],      correct:1, explanation:'πr² = 3.14 × 49 = 153.86.' },
  { id:'m6', subject:'mathematics', concept:'calculus',     difficulty:3, body:'Derivative of x³?',                        options:['3x','x²','3x²','2x³'],           correct:2, explanation:'d/dx x³ = 3x².' },
  { id:'m7', subject:'mathematics', concept:'calculus',     difficulty:3, body:'Integral of 3x² dx?',                      options:['6x','x³+C','3x+C','x²+C'],       correct:1, explanation:'∫3x² dx = x³ + C.' },
  { id:'m8', subject:'mathematics', concept:'logarithms',   difficulty:3, body:'log₂(64) = ?',                             options:['4','5','6','7'],                  correct:2, explanation:'2⁶ = 64 → log₂(64) = 6.' },
  { id:'m9', subject:'mathematics', concept:'binomial',     difficulty:3, body:'Expand (x+3)²',                            options:['x²+9','x²+6x+9','x²+3x+9','x²+6x+3'], correct:1, explanation:'(x+3)² = x²+6x+9.' },
  { id:'m10',subject:'mathematics', concept:'statistics',   difficulty:4, body:'Mean of: 4,8,6,5,7',                       options:['5','6','7','8'],                  correct:1, explanation:'(4+8+6+5+7)/5 = 30/5 = 6.' },

  // ── Programming ─────────────────────────────────────────────────────────────
  { id:'p1', subject:'programming', concept:'javascript',   difficulty:1, body:'What does `typeof null` return in JS?',    options:['null','undefined','object','string'], correct:2, explanation:'typeof null returns "object" — a known JS quirk.' },
  { id:'p2', subject:'programming', concept:'javascript',   difficulty:1, body:'Which keyword declares a block-scoped variable?', options:['var','let','const','all'], correct:1, explanation:'let is block-scoped. var is function-scoped.' },
  { id:'p3', subject:'programming', concept:'data-structures', difficulty:2, body:'Which data structure uses LIFO order?', options:['Queue','Stack','Heap','Tree'],    correct:1, explanation:'Stack uses Last-In First-Out.' },
  { id:'p4', subject:'programming', concept:'data-structures', difficulty:2, body:'Time complexity of binary search?',     options:['O(n)','O(log n)','O(n²)','O(1)'], correct:1, explanation:'Binary search halves the search space each step → O(log n).' },
  { id:'p5', subject:'programming', concept:'javascript',   difficulty:2, body:'What does `===` check in JavaScript?',     options:['Value only','Type only','Value and type','Reference'], correct:2, explanation:'=== checks both value AND type (strict equality).' },
  { id:'p6', subject:'programming', concept:'async',        difficulty:3, body:'What does `async/await` handle?',          options:['Errors','Promises','Memory','Events'], correct:1, explanation:'async/await is syntactic sugar over Promises.' },
  { id:'p7', subject:'programming', concept:'concepts',     difficulty:3, body:'What is a closure?',                       options:['A loop','A function with access to its outer scope','An error handler','A class method'], correct:1, explanation:'A closure is a function that retains access to its lexical scope.' },
  { id:'p8', subject:'programming', concept:'algorithms',   difficulty:3, body:'Which sort has O(n log n) average case?',  options:['Bubble','Selection','Merge','Insertion'], correct:2, explanation:'Merge sort consistently achieves O(n log n).' },
  { id:'p9', subject:'programming', concept:'concepts',     difficulty:4, body:'What is the event loop in Node.js?',       options:['A database loop','Mechanism handling async callbacks','A for loop','A memory manager'], correct:1, explanation:'The event loop processes the callback queue after the call stack is empty.' },
  { id:'p10',subject:'programming', concept:'algorithms',   difficulty:4, body:'Space complexity of recursive fibonacci?', options:['O(1)','O(log n)','O(n)','O(n²)'], correct:2, explanation:'Each call adds a frame to the stack → O(n) space.' },

  // ── Physics ──────────────────────────────────────────────────────────────────
  { id:'ph1',subject:'physics', concept:'mechanics',     difficulty:1, body:'SI unit of force?',                           options:['Watt','Joule','Newton','Pascal'],  correct:2, explanation:'Force is measured in Newtons (N).' },
  { id:'ph2',subject:'physics', concept:'mechanics',     difficulty:1, body:"Newton's second law: F = ?",                  options:['mv','ma','m/a','mg'],             correct:1, explanation:'F = ma — Force equals mass times acceleration.' },
  { id:'ph3',subject:'physics', concept:'mechanics',     difficulty:1, body:'Acceleration due to gravity on Earth?',       options:['8.9 m/s²','9.8 m/s²','10.8 m/s²','7.8 m/s²'], correct:1, explanation:'g ≈ 9.8 m/s² near Earth\'s surface.' },
  { id:'ph4',subject:'physics', concept:'energy',        difficulty:2, body:'Formula for kinetic energy?',                 options:['mgh','½mv²','mv','Fd'],           correct:1, explanation:'KE = ½mv².' },
  { id:'ph5',subject:'physics', concept:'electricity',   difficulty:2, body:"Ohm's law: V = ?",                           options:['I/R','IR','I+R','I²R'],           correct:1, explanation:'V = IR — Voltage equals Current times Resistance.' },
  { id:'ph6',subject:'physics', concept:'waves',         difficulty:2, body:'Speed of light in vacuum?',                   options:['3×10⁶ m/s','3×10⁷ m/s','3×10⁸ m/s','3×10⁹ m/s'], correct:2, explanation:'c ≈ 3×10⁸ m/s.' },
  { id:'ph7',subject:'physics', concept:'mechanics',     difficulty:3, body:"Newton's third law states:",                  options:['F=ma','Every action has equal opposite reaction','Objects in motion stay in motion','Energy is conserved'], correct:1, explanation:'For every action there is an equal and opposite reaction.' },
  { id:'ph8',subject:'physics', concept:'energy',        difficulty:3, body:'Formula for gravitational potential energy?', options:['½mv²','mgh','mv','Fd'],           correct:1, explanation:'GPE = mgh.' },
  { id:'ph9',subject:'physics', concept:'waves',         difficulty:3, body:'Relationship between frequency and wavelength?', options:['Direct','Inverse','No relation','Exponential'], correct:1, explanation:'v = fλ — higher frequency means shorter wavelength.' },
  { id:'ph10',subject:'physics',concept:'electricity',   difficulty:4, body:'Power formula in terms of V and R?',          options:['V²/R','VR','V/R','V²R'],         correct:0, explanation:'P = V²/R derived from P=IV and V=IR.' },

  // ── General ──────────────────────────────────────────────────────────────────
  { id:'g1', subject:'general', concept:'geography',  difficulty:1, body:'Capital of Japan?',                             options:['Seoul','Beijing','Tokyo','Bangkok'], correct:2, explanation:'Tokyo is the capital of Japan.' },
  { id:'g2', subject:'general', concept:'science',    difficulty:1, body:'How many bones in the adult human body?',       options:['196','206','216','226'],          correct:1, explanation:'Adults have 206 bones.' },
  { id:'g3', subject:'general', concept:'science',    difficulty:1, body:'Chemical symbol for gold?',                     options:['Gd','Go','Au','Ag'],              correct:2, explanation:'Au comes from the Latin "aurum".' },
  { id:'g4', subject:'general', concept:'math',       difficulty:1, body:'What is π approximately?',                      options:['3.14','3.41','3.12','3.16'],      correct:0, explanation:'π ≈ 3.14159...' },
  { id:'g5', subject:'general', concept:'science',    difficulty:2, body:'Closest planet to the Sun?',                    options:['Venus','Earth','Mars','Mercury'], correct:3, explanation:'Mercury is closest to the Sun.' },
];

const SUBJECT_MAP = {
  mathematics: 'mathematics',
  programming: 'programming',
  physics:     'physics',
  general:     'general',
  mage:        'mathematics',
  engineer:    'programming',
  scientist:   'physics',
};

export function getQuestions(heroClass, difficulty = 1) {
  const subject = SUBJECT_MAP[heroClass] || 'general';
  const pool = QUESTIONS.filter(q =>
    (q.subject === subject || q.subject === 'general') &&
    q.difficulty <= Math.min(difficulty + 1, 5) &&
    q.difficulty >= Math.max(difficulty - 1, 1)
  );
  if (pool.length < 5) return [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
}

export function getAllQuestions() { return QUESTIONS; }