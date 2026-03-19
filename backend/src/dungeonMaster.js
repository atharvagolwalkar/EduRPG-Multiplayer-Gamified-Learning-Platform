const HF_URL = process.env.HUGGING_FACE_API_URL ||
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
const HF_KEY = process.env.HUGGING_FACE_API_KEY || '';

function fallback({ isCorrect, streak, subject, concept }) {
  if (isCorrect) {
    const streakLine = streak >= 5 ? `🔥 Unstoppable! ${streak}-hit combo!`
                     : streak >= 3 ? `⚡ ${streak}-streak! Keep it up!`
                     : '✅ Solid hit!';
    return {
      narration: `${streakLine} Your mastery of ${concept} wounds the beast.`,
      hint: `Next question may escalate. Stay sharp on ${concept} fundamentals.`,
      explanation: `Strong grasp of ${subject} concepts is your main weapon here.`,
      source: 'fallback',
    };
  }
  return {
    narration: `The boss retaliates! Regroup — the raid is still winnable.`,
    hint: `For ${concept}: eliminate the obviously wrong options first.`,
    explanation: `Review the core rule of ${concept} in ${subject} before next attempt.`,
    source: 'fallback',
  };
}

export async function getDungeonMasterBeat(payload = {}) {
  const safe = {
    isCorrect: Boolean(payload.isCorrect),
    streak:    Number(payload.streak    || 0),
    subject:   payload.subject    || 'general',
    concept:   payload.concept    || 'knowledge',
    difficulty:Number(payload.difficulty || 1),
    heroClass: payload.heroClass  || 'hero',
  };

  if (!HF_KEY) return fallback(safe);

  const prompt = `[INST]You are EduRPG's Dungeon Master. Reply ONLY with valid JSON, no markdown.
Context: correct=${safe.isCorrect}, streak=${safe.streak}, subject=${safe.subject}, concept=${safe.concept}, difficulty=${safe.difficulty}, class=${safe.heroClass}
Return exactly: {"narration":"<20 words, epic battle tone>","hint":"<20 words, study strategy>","explanation":"<25 words, educational>"}[/INST]`;

  try {
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HF_KEY}` },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 180, temperature: 0.7 } }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) { console.warn(`HF API ${res.status}`); return fallback(safe); }

    const data = await res.json();
    const raw  = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!raw) return fallback(safe);

    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) return fallback(safe);

    const parsed = JSON.parse(match[0]);
    return {
      narration:   (parsed.narration   || '').substring(0, 120),
      hint:        (parsed.hint        || '').substring(0, 120),
      explanation: (parsed.explanation || '').substring(0, 150),
      source: 'huggingface',
    };
  } catch (e) {
    console.warn('HF error:', e.message);
    return fallback(safe);
  }
}