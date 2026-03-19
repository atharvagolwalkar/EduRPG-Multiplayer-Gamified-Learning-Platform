'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

const VIDEOS: Record<string, { id: string; title: string; channel: string; duration: string; desc: string }[]> = {
  mathematics: [
    { id: 'WUvTyaaNkzM', title: 'Essence of Calculus',           channel: '3Blue1Brown',         duration: '17:04', desc: 'The core ideas of calculus — visually explained.' },
    { id: 'fNk_zzaMoSs', title: 'Vectors — Linear Algebra Ch.1', channel: '3Blue1Brown',         duration: '9:52',  desc: 'What are vectors? The foundation of linear algebra.' },
    { id: 'kZTKcwFBUMc', title: 'What is e? (Eulers Number)',    channel: '3Blue1Brown',         duration: '5:13',  desc: "Euler's number intuitively explained." },
    { id: '9vKqVkMQHKk', title: 'Derivatives Explained',         channel: 'Professor Leonard',   duration: '12:44', desc: 'Understanding derivatives step by step.' },
    { id: 'rfG8ce4nNh0', title: 'Integration Made Easy',         channel: 'Khan Academy',        duration: '11:28', desc: 'The intuition behind integration.' },
    { id: 'OmJ-4B-mS-Y', title: 'Algebra Basics: Equations',    channel: 'Khan Academy',        duration: '8:31',  desc: 'Solving linear equations from scratch.' },
  ],
  programming: [
    { id: '_uQrJ0TkZlc', title: 'Python Tutorial for Beginners', channel: 'Programming with Mosh', duration: '6:14:07', desc: 'Complete Python beginner to intermediate.' },
    { id: 'HGOBQPFzWKo', title: 'Python OOP Tutorial',           channel: 'Corey Schafer',        duration: '1:34:13', desc: 'Object-oriented programming in Python.' },
    { id: 'Ej_02ICOIgs', title: 'Data Structures Explained',     channel: 'freeCodeCamp',         duration: '1:31:08', desc: 'Arrays, linked lists, trees, graphs and more.' },
    { id: 'pkYVOmU3MgA', title: 'Algorithms and Big O Notation', channel: 'CS Dojo',              duration: '12:30',   desc: 'Time complexity and Big-O explained visually.' },
    { id: 'rfscVS0vtbw', title: 'Learn JavaScript Full Course',  channel: 'freeCodeCamp',         duration: '3:26:42', desc: 'JavaScript from zero to hero.' },
    { id: 'b0IZo2Aho9Y', title: 'Async JS: Promises & Await',   channel: 'Fireship',             duration: '11:35',   desc: 'Master asynchronous JavaScript in 11 minutes.' },
  ],
  physics: [
    { id: 'ZM8ECpBuQYE', title: "Newton's Laws of Motion",       channel: 'Khan Academy',                      duration: '8:52',  desc: "The three laws that govern all motion." },
    { id: 'W9woqFSRHRk', title: 'Electricity and Circuits',      channel: 'CrashCourse Physics',               duration: '9:37',  desc: "Ohm's law, circuits, voltage explained." },
    { id: 'XRr1kaXKBsU', title: 'Waves and Light',               channel: 'CrashCourse Physics',               duration: '9:48',  desc: 'Frequency, wavelength, electromagnetic spectrum.' },
    { id: 'FpxkiKy_e9I', title: 'Thermodynamics Explained',      channel: 'The Organic Chemistry Tutor',       duration: '14:55', desc: 'Heat, energy, entropy made simple.' },
    { id: 'ZihyztQp5kI', title: 'Quantum Mechanics for Beginners',channel: 'PBS Space Time',                   duration: '14:03', desc: 'The basics of quantum physics, no math required.' },
    { id: 'AIpam8XzL5k', title: 'Special Relativity',            channel: '3Blue1Brown',                       duration: '14:30', desc: "Einstein's special relativity visually explained." },
  ],
  general: [
    { id: 'ieTe5oN3thU', title: 'How Computers Work',            channel: 'CrashCourse',         duration: '11:52', desc: 'Binary, transistors, CPUs — computers from scratch.' },
    { id: 'ZoqMiFKspAA', title: 'How the Internet Works',        channel: 'Code.org',            duration: '6:43',  desc: 'Packets, DNS, HTTP — the internet explained.' },
    { id: 'Q0Dq3QNYGms', title: 'Machine Learning Explained',    channel: 'Google for Developers', duration: '15:51', desc: 'What is ML? How does it learn?' },
    { id: 'aircAruvnKk', title: 'Neural Networks from Scratch',  channel: '3Blue1Brown',         duration: '19:13', desc: 'Visualizing how neural networks actually work.' },
    { id: 'kCc8FmEb1nY', title: 'Build a GPT from Scratch',      channel: 'Andrej Karpathy',     duration: '1:56:21', desc: 'How LLMs work — build one from scratch.' },
    { id: 'sNhhvQGsMEc', title: 'Git & GitHub Crash Course',     channel: 'Traversy Media',      duration: '32:41', desc: 'Version control you actually need to know.' },
  ],
};

const TIPS: Record<string, string[]> = {
  mathematics: [
    '📐 Draw diagrams for geometry — visualizing the problem is half the solution',
    '🔢 Check your algebra by substituting your answer back into the equation',
    '📈 For calculus: derivative = slope of the curve, integral = area under it',
    '💡 When stuck, try smaller numbers first to understand the pattern',
    '⏱️ In exams, skip hard questions and return — your brain works in the background',
  ],
  programming: [
    '🐛 Read error messages fully — they tell you exactly what broke and where',
    '📝 Write pseudocode before writing real code — it clarifies thinking',
    '🔁 Test with edge cases: empty arrays, null values, very large numbers',
    '💡 If code is confusing, add console.log() at each step to trace the flow',
    '📚 Learn by building — a small project teaches more than 10 tutorials',
  ],
  physics: [
    '🔭 Draw free body diagrams for every mechanics problem',
    '⚡ In circuits, label all known values before applying formulas',
    "🌊 Waves: remember v = fλ (velocity = frequency × wavelength)",
    '🧮 Check units! If the units work out, the formula is probably right',
    '🎯 Start with conservation laws — energy and momentum are always conserved',
  ],
  general: [
    '🧠 Active recall beats re-reading — test yourself instead of reviewing notes',
    '🗂️ Spaced repetition: review material at increasing intervals (1 day, 3 days, 1 week)',
    '📊 Teach what you learn — explaining to others cements your understanding',
    '⚡ Pomodoro: 25 min focus, 5 min break — proven to boost retention',
    '🎯 Connect new concepts to things you already know',
  ],
};

const SUBJECT_META: Record<string, { icon: string; color: string; label: string }> = {
  mathematics: { icon: '🔮', color: 'from-violet-600 to-purple-700', label: 'Mathematics' },
  programming: { icon: '⚙️', color: 'from-cyan-600 to-blue-700',    label: 'Programming' },
  physics:     { icon: '🧪', color: 'from-emerald-600 to-teal-700', label: 'Physics'     },
  general:     { icon: '🌍', color: 'from-orange-600 to-red-700',   label: 'General'     },
};

export default function TrainingPage() {
  const { user }  = useStore();
  const [subject, setSubject]   = useState('mathematics');
  const [playing, setPlaying]   = useState<string | null>(null);

  const videos = VIDEOS[subject] || [];
  const tips   = TIPS[subject]   || [];
  const meta   = SUBJECT_META[subject];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">← Back</Link>
        <h1 className="text-2xl font-black">📚 Training Room</h1>
      </div>

      {/* Hero banner */}
      <div className={`rounded-2xl bg-gradient-to-br ${meta.color} p-6 mb-6 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Now Studying</p>
          <h2 className="text-3xl font-black text-white">{meta.icon} {meta.label}</h2>
          <p className="text-white/60 text-sm mt-1">{videos.length} curated videos · {tips.length} pro tips · No login required</p>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {Object.entries(SUBJECT_META).map(([key, m]) => (
          <button key={key} onClick={() => { setSubject(key); setPlaying(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition flex-shrink-0 ${subject === key ? `bg-gradient-to-r ${m.color} text-white shadow-lg` : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Videos */}
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-3">📹 Curated Videos</p>
          <div className="space-y-3">
            {videos.map(v => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition">
                {playing === v.id ? (
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${v.id}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button className="w-full text-left flex items-center gap-4 p-4 group" onClick={() => setPlaying(v.id)}>
                    <div className="relative flex-shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-32 h-18 rounded-xl object-cover"
                        style={{ height: '72px' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-xl">
                          <span className="text-white text-sm ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm leading-snug">{v.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{v.channel} · {v.duration}</p>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-1">{v.desc}</p>
                    </div>
                  </button>
                )}
                {playing === v.id && (
                  <div className="px-4 pb-3 pt-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-white">{v.title}</p>
                      <p className="text-gray-500 text-xs">{v.channel} · {v.duration}</p>
                    </div>
                    <button onClick={() => setPlaying(null)} className="text-xs text-gray-600 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition">✕ Close</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-400 mb-3">💡 Pro Tips</p>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-3 text-sm text-gray-300 leading-6 border border-gray-700">
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className={`rounded-2xl bg-gradient-to-br ${meta.color} p-5 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative">
              <p className="font-black text-white mb-1">Ready to test your knowledge?</p>
              <p className="text-white/60 text-xs mb-3">Put these videos to the test in a raid battle!</p>
              <Link href="/raid" className="inline-flex bg-white text-black font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider hover:scale-[1.02] transition">
                ⚔️ Start a Raid
              </Link>
            </div>
          </div>

          {/* Study stats */}
          {user && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-400 mb-3">📊 Your Progress</p>
              <div className="space-y-2">
                {[
                  ['Level', user.level || 1],
                  ['Total XP', user.xp || 0],
                  ['Raids Won', user.stats?.wins || 0],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}