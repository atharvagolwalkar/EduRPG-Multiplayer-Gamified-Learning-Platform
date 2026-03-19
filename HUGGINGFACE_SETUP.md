# Hugging Face API Setup Guide

## Overview
The EduRPG platform now uses **Hugging Face API** instead of OpenAI for AI-powered features like:
- Dynamic question generation
- Dungeon Master narration and hints
- Adaptive difficulty adjustments

## Setup Steps

### 1. Get Your Hugging Face API Key
1. Go to [huggingface.co](https://huggingface.co)
2. Create a free account (or log in)
3. Navigate to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name (e.g., "EduRPG")
6. Select "Fine-grained" permissions
7. Grant "Read" access to models
8. Copy the token

### 2. Configure Environment Variables

**Backend Setup:**

1. Navigate to `backend` directory
2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your Hugging Face API key:
   ```env
   HUGGING_FACE_API_KEY=hf_your_actual_key_here
   HUGGING_FACE_API_URL=https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

### 3. Alternative Models
The setup uses **Mistral 7B** by default, but you can change it to other models:

**High-quality models (recommended):**
- `mistralai/Mistral-7B-Instruct-v0.1` (default)
- `meta-llama/Llama-2-7b-chat`
- `google/flan-t5-base`

**Lightweight models (faster, less accurate):**
- `gpt2`
- `distilgpt2`

Just update `HUGGING_FACE_API_URL` in your `.env` file.

### 4. Test the Setup

Run this cURL command to test:
```bash
curl -X GET "http://localhost:5000/api/questions?subject=mathematics&difficulty=2" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "question": {
    "id": "...",
    "body": "...",
    "options": [...],
    "correctIndex": 0,
    "difficulty": 2,
    "subject": "mathematics",
    "concept": "arithmetic",
    "explanation": "..."
  }
}
```

## Features

### 1. **Dynamic Question Generation**
- Endpoint: `GET /api/questions?subject={subject}&difficulty={1-5}`
- Generates questions based on category and difficulty
- Falls back to predefined questions if API unavailable

### 2. **Category Questions**
- Endpoint: `GET /api/questions/category/{subject}?maxDifficulty=3`
- Returns progressive questions from difficulty 1 to maxDifficulty
- Example: `/api/questions/category/mathematics?maxDifficulty=5`

### 3. **Dungeon Master Narration**
- Provides AI-generated narration for battle outcomes
- Delivers hints for incorrect answers
- Gives explanations for learning

## Supported Subjects
- `mathematics`
- `programming`
- `physics`
- `general`

## Difficulty Levels
- **1:** Fundamental concepts
- **2:** Basic problem solving
- **3:** Intermediate applications
- **4:** Advanced reasoning
- **5:** Expert-level challenges

## Fallback Behavior

If Hugging Face API fails or API key is not set:
1. System falls back to predefined question bank (guaranteed to work)
2. Dungeon Master uses pre-written responses
3. All game features continue to work normally

## Troubleshooting

### API Key Not Working
- Check your key is correctly copied (no extra spaces)
- Verify the model you're using is available in Hugging Face
- Check if your Hugging Face account has API access enabled

### Slow Response Times
- Free tier has rate limits (30 requests/hour)
- Consider upgrading to Pro for higher limits
- Use lightweight models like `gpt2` for faster responses

### "Model Loading" Errors
- First request to a model takes time (cold start)
- Subsequent requests are faster
- Try a different model if issues persist

## Costs

**Hugging Face Free Tier:**
- Free access to inference API
- Rate limits: 30 requests per hour
- Features: Question generation, narration

**Hugging Face Pro ($9/month):**
- 1000 requests per hour
- Priority support
- Recommended for production

## Backend Integration

The following services have been updated:

1. **DungeonMasterService.js**
   - Now uses Hugging Face API for narration
   - Falls back to predefined responses

2. **QuestionGenerationService.js** (NEW)
   - Generates dynamic questions with AI
   - Validates output format
   - Handles API errors gracefully

3. **firebaseRoutes.js**
   - New question endpoints
   - Dynamic question retrieval
   - Category-based question sets

## Frontend Integration

Update your frontend API calls:

```typescript
// Get a single question
const response = await fetch('/api/questions?subject=mathematics&difficulty=2');
const data = await response.json();
const question = data.question;

// Get multiple questions for a category
const response = await fetch('/api/questions/category/mathematics?maxDifficulty=5');
const data = await response.json();
const questions = data.questions; // Array of questions with increasing difficulty
```

## Production Deployment

For production, consider:
1. Store API key in secure environment (Azure Key Vault, AWS Secrets Manager)
2. Implement request rate limiting
3. Cache generated questions
4. Monitor API usage and costs
5. Set up error logging for failed requests

---

**Last Updated:** March 18, 2026
