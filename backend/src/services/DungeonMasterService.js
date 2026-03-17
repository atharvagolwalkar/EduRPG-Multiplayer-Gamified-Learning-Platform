const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildFallbackNarration({ isCorrect, streak, subject, concept, difficulty }) {
  if (isCorrect) {
    const comboLine = streak >= 3 ? `Combo streak ${streak}!` : 'Solid hit!';
    return {
      narration: `${comboLine} Your ${subject} mastery is pushing the boss back.`,
      hint: `Keep pressure on ${concept}. Aim for one careful step before choosing your final answer.`,
      explanation: `Difficulty tier ${difficulty} means the next question may be more concept-heavy.`,
      source: 'fallback',
    };
  }

  return {
    narration: `The boss counters your move, but the raid is still alive. Regroup now.`,
    hint: `Revisit the core rule behind ${concept} in ${subject}. Eliminate two wrong options first.`,
    explanation: `When stuck, identify what the question is *asking for* before doing any calculations.`,
    source: 'fallback',
  };
}

export async function generateDungeonMasterBeat(payload) {
  const safePayload = {
    isCorrect: Boolean(payload?.isCorrect),
    streak: Number(payload?.streak || 0),
    subject: payload?.subject || 'general',
    concept: payload?.concept || 'general-reasoning',
    difficulty: Number(payload?.difficulty || 1),
    heroClass: payload?.heroClass || 'adventurer',
  };

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackNarration(safePayload);
  }

  const prompt = `You are EduRPG's Dungeon Master. Produce JSON only with keys narration, hint, explanation.\nContext:\n- Correct answer: ${safePayload.isCorrect}\n- Streak: ${safePayload.streak}\n- Subject: ${safePayload.subject}\n- Concept: ${safePayload.concept}\n- Difficulty: ${safePayload.difficulty}\n- Hero class: ${safePayload.heroClass}\nRules:\n- narration <= 24 words, cinematic tone\n- hint <= 24 words, actionable\n- explanation <= 30 words, educational and clear\n- do not include markdown`; 

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return buildFallbackNarration(safePayload);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    return buildFallbackNarration(safePayload);
  }

  try {
    const parsed = JSON.parse(content);
    return {
      narration: parsed.narration || buildFallbackNarration(safePayload).narration,
      hint: parsed.hint || buildFallbackNarration(safePayload).hint,
      explanation: parsed.explanation || buildFallbackNarration(safePayload).explanation,
      source: 'openai',
    };
  } catch (_error) {
    return buildFallbackNarration(safePayload);
  }
}
