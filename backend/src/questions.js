export const QUESTIONS = [
  // ── Mathematics ──────────────────────────────────────────────────────────────
  { id:'m1',  subject:'mathematics', concept:'arithmetic',   difficulty:1, body:'What is 15 × 8?',                           options:['100','120','125','115'],              correct:1, explanation:'15 × 8 = 120.' },
  { id:'m2',  subject:'mathematics', concept:'arithmetic',   difficulty:1, body:'What is 256 ÷ 16?',                         options:['14','15','16','17'],                  correct:2, explanation:'256 ÷ 16 = 16.' },
  { id:'m3',  subject:'mathematics', concept:'fractions',    difficulty:1, body:'What is ½ + ⅓?',                            options:['2/5','5/6','3/5','4/6'],             correct:1, explanation:'½ + ⅓ = 3/6 + 2/6 = 5/6.' },
  { id:'m4',  subject:'mathematics', concept:'algebra',      difficulty:2, body:'Solve: 4x - 8 = 20',                        options:['5','6','7','8'],                      correct:2, explanation:'4x = 28 → x = 7.' },
  { id:'m5',  subject:'mathematics', concept:'algebra',      difficulty:2, body:'Factorize: x² - 9',                         options:['(x-3)(x-3)','(x+3)(x+3)','(x+3)(x-3)','(x-9)(x+1)'], correct:2, explanation:'Difference of squares: (x+3)(x-3).' },
  { id:'m6',  subject:'mathematics', concept:'percentages',  difficulty:2, body:'30% of 450 is?',                            options:['125','135','145','155'],              correct:1, explanation:'0.30 × 450 = 135.' },
  { id:'m7',  subject:'mathematics', concept:'geometry',     difficulty:2, body:'Area of triangle: base=10, height=6',       options:['30','60','16','36'],                  correct:0, explanation:'Area = ½ × 10 × 6 = 30.' },
  { id:'m8',  subject:'mathematics', concept:'calculus',     difficulty:3, body:'Derivative of 4x³ + 2x?',                  options:['12x² + 2','4x² + 2','12x + 2','8x³'], correct:0, explanation:'d/dx(4x³) = 12x², d/dx(2x) = 2.' },
  { id:'m9',  subject:'mathematics', concept:'calculus',     difficulty:3, body:'∫(6x² + 4x)dx = ?',                        options:['2x³+2x²+C','6x³+4x+C','3x³+2x²+C','2x³+4x+C'], correct:0, explanation:'∫6x² = 2x³, ∫4x = 2x².' },
  { id:'m10', subject:'mathematics', concept:'logarithms',   difficulty:3, body:'log₁₀(1000) = ?',                           options:['2','3','4','10'],                     correct:1, explanation:'10³ = 1000 → log₁₀(1000) = 3.' },
  { id:'m11', subject:'mathematics', concept:'matrices',     difficulty:4, body:'Det of [[2,3],[1,4]] = ?',                  options:['5','8','11','14'],                    correct:0, explanation:'det = (2×4) - (3×1) = 8-3 = 5.' },
  { id:'m12', subject:'mathematics', concept:'probability',  difficulty:4, body:'P(A∪B) if P(A)=0.4, P(B)=0.3, P(A∩B)=0.1?', options:['0.6','0.7','0.5','0.8'],          correct:0, explanation:'P(A∪B) = 0.4+0.3-0.1 = 0.6.' },

  // ── Programming ──────────────────────────────────────────────────────────────
  { id:'p1',  subject:'programming', concept:'javascript',      difficulty:1, body:'Which of these is NOT a JS primitive?',      options:['string','number','object','boolean'],  correct:2, explanation:'Object is a reference type, not a primitive.' },
  { id:'p2',  subject:'programming', concept:'javascript',      difficulty:1, body:'What does `===` do in JavaScript?',          options:['Assigns value','Loose equality','Strict equality','Not equal'], correct:2, explanation:'=== checks value AND type strictly.' },
  { id:'p3',  subject:'programming', concept:'javascript',      difficulty:1, body:'Output of `typeof []`?',                     options:['array','object','list','undefined'],   correct:1, explanation:'Arrays are objects in JS.' },
  { id:'p4',  subject:'programming', concept:'data-structures', difficulty:2, body:'Big-O of accessing array by index?',         options:['O(1)','O(n)','O(log n)','O(n²)'],     correct:0, explanation:'Array index access is constant time O(1).' },
  { id:'p5',  subject:'programming', concept:'data-structures', difficulty:2, body:'Which structure is best for BFS traversal?', options:['Stack','Queue','Heap','Tree'],         correct:1, explanation:'BFS uses a Queue (FIFO) to visit nodes level by level.' },
  { id:'p6',  subject:'programming', concept:'javascript',      difficulty:2, body:'What does `Promise.all()` do?',              options:['Runs one promise','Runs all in parallel','Runs sequentially','Catches errors'], correct:1, explanation:'Promise.all runs all promises in parallel and resolves when all complete.' },
  { id:'p7',  subject:'programming', concept:'algorithms',      difficulty:3, body:'Average time complexity of quicksort?',      options:['O(n)','O(n log n)','O(n²)','O(log n)'], correct:1, explanation:'Quicksort averages O(n log n) with good pivot selection.' },
  { id:'p8',  subject:'programming', concept:'concepts',        difficulty:3, body:'What is memoization?',                       options:['A sorting technique','Caching function results','Memory management','Loop optimization'], correct:1, explanation:'Memoization caches results of expensive function calls to avoid recomputation.' },
  { id:'p9',  subject:'programming', concept:'patterns',        difficulty:3, body:'Observer pattern is used for?',              options:['Database queries','Event-driven communication','Memory allocation','Sorting'], correct:1, explanation:'Observer enables event-driven communication between objects.' },
  { id:'p10', subject:'programming', concept:'algorithms',      difficulty:4, body:'Space complexity of merge sort?',            options:['O(1)','O(log n)','O(n)','O(n²)'],     correct:2, explanation:'Merge sort requires O(n) auxiliary space for the merge step.' },
  { id:'p11', subject:'programming', concept:'concepts',        difficulty:4, body:'What is a race condition?',                  options:['Fast algorithm','Two threads accessing shared data unsafely','Memory leak','Stack overflow'], correct:1, explanation:'A race condition occurs when two threads access shared data without proper synchronization.' },

  // ── Physics ──────────────────────────────────────────────────────────────────
  { id:'ph1', subject:'physics', concept:'mechanics',     difficulty:1, body:'Unit of power?',                               options:['Newton','Joule','Watt','Pascal'],       correct:2, explanation:'Power is measured in Watts (W = J/s).' },
  { id:'ph2', subject:'physics', concept:'mechanics',     difficulty:1, body:'Formula: Work = ?',                           options:['F×t','F×d','m×v','m×a'],              correct:1, explanation:'Work = Force × Distance.' },
  { id:'ph3', subject:'physics', concept:'waves',         difficulty:1, body:'Light travels at approximately?',             options:['3×10⁶ m/s','3×10⁷ m/s','3×10⁸ m/s','3×10⁹ m/s'], correct:2, explanation:'c ≈ 3×10⁸ m/s in vacuum.' },
  { id:'ph4', subject:'physics', concept:'energy',        difficulty:2, body:'A 2kg ball at 3m height, GPE = ? (g=10)',     options:['30J','60J','45J','20J'],               correct:1, explanation:'GPE = mgh = 2×10×3 = 60J.' },
  { id:'ph5', subject:'physics', concept:'electricity',   difficulty:2, body:'3Ω and 6Ω in parallel = ?',                  options:['9Ω','2Ω','4.5Ω','1Ω'],               correct:1, explanation:'1/R = 1/3 + 1/6 = 1/2 → R = 2Ω.' },
  { id:'ph6', subject:'physics', concept:'mechanics',     difficulty:2, body:'Momentum = ?',                               options:['m+v','m×v','m×a','F×t'],              correct:1, explanation:'Momentum p = mv (mass × velocity).' },
  { id:'ph7', subject:'physics', concept:'thermodynamics',difficulty:3, body:'First law of thermodynamics states:',        options:['Energy is destroyed','Energy is conserved','Entropy always decreases','Heat flows cold to hot'], correct:1, explanation:'Energy cannot be created or destroyed, only converted.' },
  { id:'ph8', subject:'physics', concept:'waves',         difficulty:3, body:'Wave speed = ?',                             options:['f/λ','f×λ','f+λ','λ/f'],              correct:1, explanation:'v = fλ (frequency × wavelength).' },
  { id:'ph9', subject:'physics', concept:'electricity',   difficulty:3, body:'Electric field unit?',                       options:['Tesla','N/C or V/m','Ohm','Farad'],    correct:1, explanation:'Electric field is measured in N/C or equivalently V/m.' },
  { id:'ph10',subject:'physics', concept:'mechanics',     difficulty:4, body:'Centripetal acceleration formula?',          options:['v²/r','vr','v/r²','r/v²'],            correct:0, explanation:'a_c = v²/r where v is speed and r is radius.' },

  // ── General Knowledge ─────────────────────────────────────────────────────────
  { id:'g1',  subject:'general', concept:'science',    difficulty:1, body:'DNA stands for?',                              options:['Deoxyribonucleic Acid','Dynamic Nuclear Array','Digital Network Access','Direct Nitrogen Agent'], correct:0, explanation:'DNA = Deoxyribonucleic Acid, carrier of genetic info.' },
  { id:'g2',  subject:'general', concept:'geography',  difficulty:1, body:'Largest ocean on Earth?',                     options:['Atlantic','Indian','Arctic','Pacific'], correct:3, explanation:'The Pacific Ocean is the largest, covering ~46% of Earth\'s water.' },
  { id:'g3',  subject:'general', concept:'science',    difficulty:1, body:'Chemical symbol of Sodium?',                  options:['So','Na','S','Sd'],                    correct:1, explanation:'Na from Latin "Natrium".' },
  { id:'g4',  subject:'general', concept:'tech',       difficulty:2, body:'What does HTTP stand for?',                   options:['High Transfer Text Protocol','HyperText Transfer Protocol','Host Transfer Token Protocol','HyperText Transmission Protocol'], correct:1, explanation:'HTTP = HyperText Transfer Protocol.' },
  { id:'g5',  subject:'general', concept:'logic',      difficulty:2, body:'If all A are B and all B are C, then?',       options:['All C are A','Some A are C','All A are C','None of the above'], correct:2, explanation:'Transitive syllogism: if A⊆B and B⊆C then A⊆C.' },
];

const SUBJECT_MAP = { mage:'mathematics', engineer:'programming', scientist:'physics' };

export function getQuestionsForRaid(heroClass, difficulty = 1) {
  const subject = SUBJECT_MAP[heroClass] || 'general';
  const pool = QUESTIONS.filter(q =>
    (q.subject === subject || q.subject === 'general') &&
    q.difficulty >= Math.max(1, difficulty - 1) &&
    q.difficulty <= Math.min(5, difficulty + 1)
  );
  const base = pool.length >= 8 ? pool : QUESTIONS.filter(q => q.subject === subject || q.subject === 'general');
  return [...base].sort(() => Math.random() - 0.5).slice(0, 12);
}

export { getQuestionsForRaid as getQuestions };