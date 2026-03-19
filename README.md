# EduRPG — Hackathon Submission Answers
# Copy-paste these into your submission form

## Project Name
EduRPG — Multiplayer Gamified Learning Platform

## Tagline (one line)
Turn studying into epic real-time multiplayer boss raids powered by AI

## Problem Statement
Traditional learning platforms are passive and repetitive. Students lose
motivation because content is delivered, not experienced. Most EdTech apps
treat learning as consumption — EduRPG treats it as combat.

## Solution
EduRPG transforms studying into a real-time RPG where students:
- Form raid parties and fight boss monsters by answering questions
- Deal damage with correct answers, take damage for wrong ones
- Get narrated feedback from an AI Dungeon Master after every answer
- Train with curated subject videos before entering battles
- Climb trophy leagues from Bronze to Legend

## Key Features
1. Real-time multiplayer raids — share a 6-letter code, teammates join live
2. AI Dungeon Master — HuggingFace Mistral-7B narrates every answer
3. 6 unique hero classes with special abilities (Mage, Engineer, Scientist,
   Warrior, Archer, Alchemist)
4. 5 boss monsters themed to subjects (Calculus Titan, Code Demon, etc.)
5. Training Room — 24 curated YouTube videos across 4 subjects
6. Trophy + League system — Bronze → Silver → Gold → Diamond → Legend
7. Daily login streaks with XP bonuses
8. Achievement system with 8 unlockable badges
9. Guild system with shared XP
10. Adaptive difficulty — questions get harder as accuracy improves

## Tech Stack
Frontend:  Next.js 14, React, TypeScript, Tailwind CSS, Zustand
Backend:   Node.js, Express, Socket.io (real-time WebSockets)
Database:  In-memory store (no setup required, instant demo)
AI:        HuggingFace Mistral-7B-Instruct (with smart fallback)
Deploy:    Vercel (frontend) + Render (backend)

## What makes it innovative?
Unlike existing EdTech tools that are async quizzes, EduRPG creates
genuine collaborative moments. When a teammate answers correctly,
EVERYONE sees the boss HP bar drop in real time. The AI doesn't just
grade — it narrates the battle, gives tactical hints, and explains
concepts in character. Learning becomes a shared, memorable experience.

## Challenges we faced
- Real-time state synchronization across multiple players in the same raid
- Making AI narration feel natural and contextual to the game moment
- Balancing game difficulty to be challenging but not frustrating
- Building a complete RPG progression system (XP, levels, leagues, skills)
  within hackathon time constraints

## What's next
- Persistent database (Supabase/Turso) for cross-session data
- Async PvP — attack opponents with custom question sets
- Clan war system — guilds compete in team quiz tournaments
- Mobile app (React Native)
- Teacher dashboard for classroom management

## Live Demo
Frontend: https://your-app.vercel.app
Backend:  https://your-backend.onrender.com/health
GitHub:   https://github.com/your-username/your-repo