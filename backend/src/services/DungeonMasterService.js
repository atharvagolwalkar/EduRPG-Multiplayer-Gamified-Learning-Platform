const HUGGING_FACE_API_URL = process.env.HUGGING_FACE_API_URL || 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || '';

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

  if (!HUGGING_FACE_API_KEY) {
    console.warn('⚠️  Hugging Face API key not configured. Using fallback narration system.');
    return buildFallbackNarration(safePayload);
  }

  const prompt = `You are EduRPG's Dungeon Master. Respond ONLY with JSON (no markdown, no code blocks) with keys: narration, hint, explanation.
Context: Correct=${safePayload.isCorrect}, Streak=${safePayload.streak}, Subject=${safePayload.subject}, Concept=${safePayload.concept}, Difficulty=${safePayload.difficulty}, Hero=${safePayload.heroClass}
Constraints:
- narration: max 24 words, cinematic tone
- hint: max 24 words, actionable strategy
- explanation: max 30 words, educational
Return only valid JSON.`;

  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
        },
      }),
      timeout: 10000,
    });

    if (!response.ok) {
      console.warn(`⚠️  Hugging Face API returned ${response.status}. Using fallback.`);
      return buildFallbackNarration(safePayload);
    }

    const data = await response.json();
    const generatedText = Array.isArray(data) && data[0]?.generated_text 
      ? data[0].generated_text 
      : data?.generated_text;

    if (!generatedText) {
      console.warn('⚠️  Hugging Face returned empty response. Using fallback.');
      return buildFallbackNarration(safePayload);
    }

    // Extract JSON from potentially wrapped response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
    
    const parsed = JSON.parse(jsonStr);
    const beat = {
      narration: (parsed.narration || '').substring(0, 24) || buildFallbackNarration(safePayload).narration,
      hint: (parsed.hint || '').substring(0, 24) || buildFallbackNarration(safePayload).hint,
      explanation: (parsed.explanation || '').substring(0, 30) || buildFallbackNarration(safePayload).explanation,
      source: 'huggingface',
    };
    console.log('✅ Hugging Face narration generated successfully');
    return beat;
  } catch (error) {
    console.error('❌ Hugging Face API error:', error.message, '- Using fallback narration');
    return buildFallbackNarration(safePayload);
  }
}
