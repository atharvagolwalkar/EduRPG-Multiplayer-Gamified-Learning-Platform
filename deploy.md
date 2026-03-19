# EduRPG Deployment Guide
# Frontend → Vercel | Backend → Render

## STEP 1 — Push to GitHub
# (Do this first — both Vercel and Render deploy from GitHub)

cd your-project-root
git add .
git commit -m "feat: complete EduRPG with all features"
git push origin main


## STEP 2 — Deploy Backend on Render (Free)
# Takes ~5 minutes

1. Go to https://render.com → Sign up / Login
2. Click "New +" → "Web Service"
3. Connect GitHub → select your repo
4. Configure:
   Name:           edurpg-backend
   Root Directory: backend
   Runtime:        Node
   Build Command:  npm install
   Start Command:  npm start
5. Click "Advanced" → "Add Environment Variable"
   Add:
     PORT                  = 10000
     NODE_ENV              = production
     HUGGING_FACE_API_KEY  = hf_your_key_here   ← your actual key
     HUGGING_FACE_API_URL  = https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1
6. Click "Create Web Service"
7. Wait ~3 minutes for first deploy
8. Copy your URL: https://edurpg-backend.onrender.com


## STEP 3 — Deploy Frontend on Vercel (Free)
# Takes ~3 minutes

1. Go to https://vercel.com → Sign up / Login with GitHub
2. Click "New Project" → Import your repo
3. Configure:
   Framework Preset: Next.js (auto-detected)
   Root Directory:   frontend
4. Click "Environment Variables" → Add:
   NEXT_PUBLIC_API_URL = https://edurpg-backend.onrender.com
                         ↑ paste your Render URL here
5. Click "Deploy"
6. Wait ~2 minutes
7. Your live URL: https://edurpg-xyz.vercel.app


## STEP 4 — Fix CORS (important!)
# After Vercel gives you a URL, add it to Render env vars

1. Go to Render → your service → Environment
2. Add:
   FRONTEND_URL = https://edurpg-xyz.vercel.app
3. Render will auto-redeploy (~1 min)


## STEP 5 — Test live site
1. Open your Vercel URL
2. Register a new account
3. Create a raid → copy the code
4. Open in a second tab → join with the code
5. Answer questions — HP bars should update live in BOTH tabs
6. Check leaderboard shows your entry


## STEP 6 — Keep backend awake (Render free tier sleeps after 15 min)

Option A (easiest): UptimeRobot
1. Go to https://uptimerobot.com → Free account
2. New Monitor → HTTP(s)
3. URL: https://edurpg-backend.onrender.com/health
4. Interval: every 5 minutes
5. Done — backend stays awake 24/7

Option B: Add to backend package.json scripts
"start": "node src/server.js"
(already done)


## TROUBLESHOOTING

Problem: CORS error in browser console
Fix: Make sure FRONTEND_URL is set in Render env vars

Problem: WebSocket not connecting
Fix: Render supports WebSockets on free tier — just make sure
     NEXT_PUBLIC_API_URL does NOT have a trailing slash

Problem: "Application error" on Vercel
Fix: Check Vercel deployment logs → Functions tab
     Usually a missing env var

Problem: Render deploy fails
Fix: Check build logs — usually a missing package
     Make sure backend/package.json has all dependencies

Problem: API returns 500 after deploy
Fix: Check Render logs in real time:
     Render Dashboard → your service → Logs tab


## YOUR LIVE URLS (fill in after deploy)
Backend:  https://________________________.onrender.com
Frontend: https://________________________.vercel.app