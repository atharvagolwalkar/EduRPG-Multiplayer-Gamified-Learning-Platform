'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getRaidSocket } from '@/lib/socket';

const HERO_ATK = { mage: 30, engineer: 25, scientist: 22 };
const HERO_HP  = { mage: 90, engineer: 110, scientist: 100 };

function HPBar({ label, hp, maxHp, color }: { label: string; hp: number; maxHp: number; color: 'red'|'green' }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const bar = color === 'red'
    ? pct > 50 ? 'bg-rose-500' : pct > 25 ? 'bg-orange-400' : 'bg-red-700 animate-pulse'
    : pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-400' : 'bg-red-600 animate-pulse';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-semibold">
        <span className="text-slate-300">{label}</span>
        <span>{Math.ceil(hp)}/{maxHp}</span>
      </div>
      <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RaidPage() {
  const { user, updateUser } = useStore();
  const [questions, setQuestions] = useState<any[]>([]);
  const [qIdx,      setQIdx]      = useState(0);
  const [raid,      setRaid]      = useState<any>(null);
  const [players,   setPlayers]   = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [active,    setActive]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [notice,    setNotice]    = useState('');
  const [noticeOk,  setNoticeOk]  = useState(true);
  const [awaiting,  setAwaiting]  = useState(false);
  const [summary,   setSummary]   = useState<any>(null);
  const [dm,        setDm]        = useState<any>(null);
  const [timer,     setTimer]     = useState(180);
  const [difficulty,setDifficulty]= useState(1);
  const timerRef  = useRef<any>(null);
  const joinedRef = useRef<string | null>(null);
  const sockRef   = useRef<any>(null);

  const heroClass = user?.heroClass || 'mage';
  const atk = HERO_ATK[heroClass as keyof typeof HERO_ATK] || 25;
  const maxHp = HERO_HP[heroClass as keyof typeof HERO_HP] || 100;

  // Load questions
  useEffect(() => {
    if (!user) return;
    api.getQuestions(heroClass, difficulty).then(d => setQuestions(d.questions || [])).catch(() => {});
  }, [user, difficulty]);

  // Socket setup
  useEffect(() => {
    const s = getRaidSocket();
    sockRef.current = s;
    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    if (s.connected) setConnected(true);
    return () => { s.off('connect'); s.off('disconnect'); };
  }, []);

  // Socket events
  useEffect(() => {
    const s = sockRef.current;
    if (!s || !active) return;

    const onSync    = (d: any) => { setRaid(d.raid); setPlayers(d.players || []); };
    const onJoined  = (d: any) => { setRaid(d.raid); setPlayers(d.players || []); showNotice(d.message, true); };
    const onDamage  = (d: any) => {
      setRaid(d.raid); setPlayers(d.players || []);
      showNotice(d.message || '', d.type === 'player-attack');
      if (d.adaptiveSignal === 'increase') setDifficulty(v => Math.min(5, v + 1));
      if (d.adaptiveSignal === 'decrease') setDifficulty(v => Math.max(1, v - 1));
      setTimeout(() => { setAwaiting(false); setQIdx(i => (i + 1 < questions.length ? i + 1 : 0)); }, 900);
    };
    const onDM      = (d: any) => setDm(d);
    const onEnd     = (d: any) => {
      setRaid({ ...d.raid, status: d.status }); setPlayers(d.players || []);
      setSummary(d); setActive(false); stopTimer();
      if (d.xpReward && user) updateUser({ xp: (user.xp||0) + d.xpReward, totalXp: (user.totalXp||0) + d.xpReward });
      showNotice(d.status === 'victory' ? `🏆 Victory! +${d.xpReward} XP` : '💀 Defeated... regroup!', d.status === 'victory');
    };
    const onTick    = (d: any) => setTimer(d.timeRemaining);
    const onLeft    = (d: any) => showNotice(d.message || 'A player left.', false);

    s.on('raid:sync',          onSync);
    s.on('raid:player-joined', onJoined);
    s.on('raid:damage',        onDamage);
    s.on('raid:dm',            onDM);
    s.on('raid:end',           onEnd);
    s.on('raid:tick',          onTick);
    s.on('raid:player-left',   onLeft);
    s.on('raid:update',        onSync);

    return () => {
      s.off('raid:sync'); s.off('raid:player-joined'); s.off('raid:damage');
      s.off('raid:dm'); s.off('raid:end'); s.off('raid:tick'); s.off('raid:player-left'); s.off('raid:update');
    };
  }, [active, questions.length, user]);

  // Auto socket join
  useEffect(() => {
    if (!connected || !user || !raid?.id || joinedRef.current === raid.id) return;
    sockRef.current?.emit('raid:join', { raidId: raid.id, player: { id: user.id, username: user.username, heroClass } });
    joinedRef.current = raid.id;
  }, [connected, raid?.id, user, heroClass]);

  function startTimer() { setTimer(180); timerRef.current = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000); }
  function stopTimer()  { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  useEffect(() => () => stopTimer(), []);

  function showNotice(msg: string, ok: boolean) { setNotice(msg); setNoticeOk(ok); }

  async function createRaid() {
    if (!user) return;
    setLoading(true); setSummary(null); setDm(null);
    try {
      const { raid: r } = await api.startRaid({ monsterName: 'Calculus Titan', monsterHp: 100, teamHp: maxHp });
      setRaid(r); setPlayers(r.players || []); joinedRef.current = null;
      setQIdx(0); setActive(true); startTimer();
      showNotice(`Raid ${r.id} created — share this code with teammates!`, true);
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  async function joinRaid() {
    if (!user || !codeInput.trim()) return;
    setLoading(true); setSummary(null); setDm(null);
    try {
      const { raid: r } = await api.getRaid(codeInput.trim().toUpperCase());
      if (!r) { showNotice('Raid not found', false); return; }
      setRaid(r); setPlayers(r.players || []); joinedRef.current = null;
      setQIdx(0); setActive(true); startTimer();
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  function handleAnswer(idx: number) {
    if (!user || !raid || awaiting) return;
    const q = questions[qIdx];
    if (!q) return;
    const isCorrect = idx === q.correct;
    const streak    = raid.streak || 0;
    const mult      = 1 + Math.min(streak * 0.1, 2);
    const dmg       = Math.floor(atk * mult) + (streak >= 3 ? 5 : 0);
    setAwaiting(true);
    showNotice(isCorrect ? `✅ ${q.explanation}` : `❌ ${q.explanation}`, isCorrect);
    sockRef.current?.emit('raid:answer', { raidId: raid.id, isCorrect, damage: dmg, subject: q.subject, concept: q.concept, difficulty, heroClass });
  }

  if (!user) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center"><p className="text-slate-400 mb-4">Login first</p>
        <Link href="/" className="glass px-5 py-2 rounded-xl text-sm hover:bg-white/10">← Home</Link></div>
    </main>
  );

  const mm = String(Math.floor(timer/60)).padStart(2,'0');
  const ss = String(timer%60).padStart(2,'0');

  // ── Lobby ───────────────────────────────────────────────────────────────────
  if (!active) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="glass px-4 py-2 rounded-xl text-sm hover:bg-white/10">← Back</Link>
        <h1 className="text-2xl font-black">⚔️ Raid Arena</h1>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{connected ? '🟢 Live' : '🔴 Connecting'}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="glass rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-1">Create a raid room</p>
          <p className="text-xs text-slate-600 mb-4">Get a shareable code for your team (3–5 players)</p>
          <button onClick={createRaid} disabled={loading || !connected}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm disabled:opacity-50 hover:scale-[1.01] transition">
            {loading ? '...' : '⚔️ Create Raid'}
          </button>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-1">Join an existing raid</p>
          <p className="text-xs text-slate-600 mb-4">Enter the 6-character code your teammate shared</p>
          <div className="flex gap-2">
            <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="ABC123"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 font-mono tracking-widest text-center" />
            <button onClick={joinRaid} disabled={loading || !codeInput.trim() || !connected}
              className="bg-cyan-500 hover:bg-cyan-400 px-5 rounded-xl font-bold transition disabled:opacity-50">Join</button>
          </div>
        </div>
      </div>

      {notice && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${noticeOk ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>{notice}</div>}

      {summary && (
        <div className="glass rounded-2xl p-5 mb-4">
          <p className="text-slate-400 text-sm mb-3">Last raid result</p>
          <div className="grid grid-cols-3 gap-3">
            {[['Result', summary.status], ['XP', `+${summary.xpReward}`], ['Correct', summary.correctAnswers]].map(([k,v]) => (
              <div key={k} className="bg-slate-800/60 rounded-xl p-3 text-center">
                <p className="text-lg font-black capitalize">{v}</p><p className="text-xs text-slate-500">{k}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );

  // ── Battle ──────────────────────────────────────────────────────────────────
  const q = questions[qIdx];

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="glass px-3 py-1.5 rounded-lg text-sm hover:bg-white/10">←</Link>
          <h1 className="text-xl font-black">{raid?.monsterName || 'Boss Battle'}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(raid?.streak || 0) >= 2 && (
            <span className="bg-orange-500/20 border border-orange-400/40 text-orange-200 px-3 py-1 rounded-full text-sm font-black animate-pulse">
              🔥 ×{raid.streak} COMBO
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-black ${timer <= 30 ? 'bg-red-500/20 text-red-300 animate-pulse border border-red-400/40' : 'glass text-slate-300'}`}>
            ⏱ {mm}:{ss}
          </span>
          <span className="glass text-slate-400 text-xs px-3 py-1 rounded-full font-mono">{raid?.id}</span>
        </div>
      </div>

      {/* HP Bars */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div className="glass rounded-xl p-4"><HPBar label="Boss HP" hp={raid?.monsterHp||0} maxHp={raid?.monsterMaxHp||100} color="red" /></div>
        <div className="glass rounded-xl p-4"><HPBar label="Team HP"  hp={raid?.teamHp||0}    maxHp={raid?.teamMaxHp||100}    color="green" /></div>
      </div>

      {/* Notice */}
      {notice && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold mb-4 ${noticeOk ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
          {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_270px] gap-4">
        <div className="space-y-4">
          {/* Question card */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm">Q {qIdx+1}/{questions.length}</p>
              <div className="flex gap-2">
                <span className="text-xs bg-slate-800 px-2 py-1 rounded-full capitalize">{q?.subject}</span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded-full">tier {q?.difficulty}</span>
              </div>
            </div>
            {q ? (
              <>
                <p className="text-lg font-bold leading-7 mb-5">{q.body}</p>
                <div className="grid gap-2">
                  {q.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={awaiting || !connected}
                      className="text-left glass hover:border-cyan-400/60 hover:bg-cyan-400/5 px-4 py-3 rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="inline-flex w-7 h-7 bg-slate-700 rounded-full items-center justify-center text-xs font-black mr-3">
                        {String.fromCharCode(65+i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : <p className="text-slate-500 text-center py-8">Loading questions...</p>}
          </div>

          {/* AI Dungeon Master */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-300">🎭 AI Dungeon Master</p>
              {dm?.source && <span className="text-xs text-slate-600 capitalize">{dm.source}</span>}
            </div>
            {dm ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-bold text-cyan-300">⚔️</span> {dm.narration}</p>
                <p><span className="font-bold text-emerald-300">💡</span> {dm.hint}</p>
                <p><span className="font-bold text-amber-300">📖</span> {dm.explanation}</p>
              </div>
            ) : <p className="text-slate-600 text-sm">Answer a question to receive live narration, hints and explanations.</p>}
          </div>
        </div>

        {/* Squad + Stats */}
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Squad · {players.length}/5</p>
            <div className="space-y-2">
              {players.map((p: any) => (
                <div key={p.id} className="bg-slate-800/60 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{p.username}{p.id===user.id?' (you)':''}</p>
                      <p className="text-xs text-slate-500 capitalize">{p.hero_class||p.heroClass}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-300 text-sm font-bold">{p.damage_dealt||0}</p>
                      <p className="text-xs text-slate-600">{p.correct_ans||0} correct</p>
                    </div>
                  </div>
                </div>
              ))}
              {players.length === 0 && <p className="text-slate-600 text-xs text-center py-2">Waiting for players...</p>}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 space-y-2">
            {[['Streak', raid?.streak||0], ['Correct', raid?.correctAnswers||0], ['Difficulty', `Tier ${difficulty}`], ['XP at stake', `${100 + (raid?.correctAnswers||0) * 10}`]].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}