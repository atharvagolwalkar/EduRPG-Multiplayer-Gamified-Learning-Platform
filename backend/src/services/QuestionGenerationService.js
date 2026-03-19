const HUGGING_FACE_API_URL = process.env.HUGGING_FACE_API_URL || 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || '';

// Predefined question bank for fallback
const FALLBACK_QUESTIONS = [
  { id: 'math-1', body: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1, difficulty: 1, subject: 'mathematics', concept: 'arithmetic', explanation: 'Adding 2 and 2 gives 4.' },
  { id: 'math-2', body: 'What is 10 - 3?', options: ['6', '7', '8', '9'], correctIndex: 1, difficulty: 1, subject: 'mathematics', concept: 'arithmetic', explanation: 'Subtracting 3 from 10 gives 7.' },
  { id: 'prog-1', body: 'What does let do in JavaScript?', options: ['Declares a block-scoped variable', 'Defines a constant', 'Creates a function', 'Imports a module'], correctIndex: 0, difficulty: 1, subject: 'programming', concept: 'javascript-basics', explanation: 'let declares a variable whose scope is limited to the block.' },
  { id: 'phys-1', body: 'What is the SI unit of force?', options: ['Joule', 'Pascal', 'Newton', 'Watt'], correctIndex: 2, difficulty: 1, subject: 'physics', concept: 'mechanics', explanation: 'Force is measured in newtons.' },
];

function getQuestionsBySubjectAndDifficulty(subject, difficulty) {
  return FALLBACK_QUESTIONS.filter(
    (q) => q.subject === subject && q.difficulty === difficulty
  );
}

export async function generateDynamicQuestion(subject, difficulty, concept) {
  // Try to use predefined questions first
  const fallbackQuestions = getQuestionsBySubjectAndDifficulty(subject, difficulty);
  if (fallbackQuestions.length > 0 && Math.random() > 0.3) {
    // 70% of the time, use predefined questions (more reliable)
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }

  // 30% of the time, try to generate dynamic questions with AI
  if (!HUGGING_FACE_API_KEY) {
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }

  try {
    return await generateWithHuggingFace(subject, difficulty, concept);
  } catch (_error) {
    console.error('Dynamic question generation failed, using fallback:', _error.message);
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

async function generateWithHuggingFace(subject, difficulty, concept) {
  const difficultyDescriptions = {
    1: 'fundamental concepts',
    2: 'basic problem solving',
    3: 'intermediate applications',
    4: 'advanced reasoning',
    5: 'expert-level challenges',
  };

  const prompt = `Generate a multiple-choice question for educational assessment. Return ONLY valid JSON (no markdown).
Subject: ${subject}
Difficulty Level: ${difficulty}/5 (${difficultyDescriptions[difficulty] || 'intermediate'})
Concept: ${concept}

Requirements:
- Question must test ${concept}
- Difficulty appropriate to level ${difficulty}
- Exactly 4 distractor options, only 1 correct
- All options plausible but distinct

Response format JSON:
{
  "id": "gen-${Date.now()}",
  "body": "clear question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0,
  "difficulty": ${difficulty},
  "subject": "${subject}",
  "concept": "${concept}",
  "explanation": "why this is correct"
}`;

  const response = await fetch(HUGGING_FACE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
      },
    }),
    timeout: 15000,
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = Array.isArray(data) && data[0]?.generated_text 
    ? data[0].generated_text 
    : data?.generated_text;

  if (!generatedText) {
    throw new Error('No generated text from Hugging Face');
  }

  // Extract JSON from potentially wrapped response
  const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
  
  const question = JSON.parse(jsonStr);
  
  // Validate the response
  if (!question.body || !question.options || question.options.length !== 4 || question.correctIndex === undefined) {
    throw new Error('Invalid question structure from API');
  }

  return {
    id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    body: question.body,
    options: question.options,
    correctIndex: question.correctIndex,
    difficulty: question.difficulty || difficulty,
    subject: question.subject || subject,
    concept: question.concept || concept,
    explanation: question.explanation || 'Review the concept to understand the correct answer.',
  };
}

export async function generateQuestionsForCategory(subject, maxDifficulty = 3) {
  const questions = [];
  for (let diff = 1; diff <= maxDifficulty; diff++) {
    const q = await generateDynamicQuestion(subject, diff, 'core-concept');
    if (q) questions.push(q);
  }
  return questions;
}
