'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getRaidSocket } from '@/lib/socket';
import { HERO_STATS, BOSSES, ACHIEVEMENTS, calcDamage, type HeroClass } from '@/lib/game';

const RAID_DURATION = 180;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function HPBar({ label, current, max, color }: { label: string; current: number; max: number; color: 'red' | 'green' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const bar = color === 'red'
    ? pct > 50 ? 'bg-rose-500' : pct > 25 ? 'bg-orange-500' : 'bg-red-700 animate-pulse'
    : pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-400' : 'bg-red-500 animate-pulse';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5 font-bold">
        <span className="text-gray-300">{label}</span>
        <span className="tabular-nums">{Math.ceil(current)}/{max}</span>
      </div>
      <div className="h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AchievementToast({ achievements, onDone }: { achievements: string[]; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {achievements.map(id => {
        const a = ACHIEVEMENTS[id];
        if (!a) return null;
        return (
          <div key={id} className="bg-amber-400 text-black rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-2xl">{a.icon}</span>
            <div>
              <p className="font-black text-sm">Achievement Unlocked!</p>
              <p className="text-xs font-bold">{a.name} — {a.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RaidPage() {
  const { user, updateUser } = useStore();
  const [questions,       setQuestions]       = useState<any[]>([]);
  const [qIndex,          setQIndex]          = useState(0);
  const [raidState,       setRaidState]       = useState<any>(null);
  const [connected,       setConnected]       = useState(false);
  const [active,          setActive]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [codeInput,       setCodeInput]       = useState('');
  const [notice,          setNotice]          = useState('');
  const [noticeOk,        setNoticeOk]        = useState(true);
  const [awaiting,        setAwaiting]        = useState(false);
  const [summary,         setSummary]         = useState<any>(null);
  const [timerSec,        setTimerSec]        = useState(RAID_DURATION);
  const [difficulty,      setDifficulty]      = useState(1);
  const [dmBeat,          setDmBeat]          = useState<any>(null);
  const [dmLoading,       setDmLoading]       = useState(false);
  const [lastDamage,      setLastDamage]      = useState<any>(null);
  const [selectedBoss,    setSelectedBoss]    = useState(BOSSES[0]);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [maxStreak,       setMaxStreak]       = useState(0);
  const timerRef  = useRef<any>(null);
  const joinedRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    api.getQuestions(user.heroClass, difficulty).then(d => setQuestions(d.questions || [])).catch(() => {});
  }, [user, difficulty]);

  useEffect(() => {
    const socket = getRaidSocket();
    socketRef.current = socket;
    const onConn = () => setConnected(true);
    const onDisc = () => setConnected(false);
    socket.on('connect', onConn); socket.on('disconnect', onDisc);
    if (socket.connected) setConnected(true);
    return () => { socket.off('connect', onConn); socket.off('disconnect', onDisc); };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !active) return;
    const onSync   = (d: any) => setRaidState(d.raid);
    const onJoined = (d: any) => { setRaidState(d.raid); showNotice(d.message || 'Player joined!', true); };
    const onDamage = (d: any) => {
      setRaidState(d.raid);
      setLastDamage({ value: d.damage, type: d.type });
      showNotice(d.message || '', d.type === 'player-attack');
      setMaxStreak(s => Math.max(s, d.raid?.streak || 0));
      setTimeout(() => setLastDamage(null), 1500);
      if (d.adaptiveSignal === 'increase') setDifficulty(v => Math.min(5, v + 1));
      if (d.adaptiveSignal === 'decrease') setDifficulty(v => Math.max(1, v - 1));
      setTimeout(() => { setAwaiting(false); setQIndex(i => i + 1 < questions.length ? i + 1 : 0); }, 900);
    };
    const onEnd = (d: any) => {
      setRaidState({ ...d.raid, status: d.status });
      setSummary(d);
      setActive(false);
      stopTimer();
      if (d.updatedPlayers && user) {
        const me = d.updatedPlayers.find((p: any) => p.id === user.id);
        if (me) updateUser({ xp: me.xp, totalXp: me.totalXp, level: me.level, stats: me.stats });
      }
      // Check achievements
      const stats = {
        totalDamage:   d.totalDamage || 0,
        maxStreak,
        accuracy:      d.correctAnswers > 0 && d.correctAnswers === d.raid?.questionsAnswered ? 100 : 0,
        timeLeft:      timerSec,
        totalCorrect:  d.correctAnswers || 0,
        teamSize:      d.raid?.players?.length || 1,
        totalWins:     (user?.stats?.wins || 0) + (d.status === 'victory' ? 1 : 0),
        uniqueBosses:  1,
      };
      const earned = Object.entries(ACHIEVEMENTS)
        .filter(([, a]) => { try { return a.condition(stats); } catch { return false; } })
        .map(([id]) => id);
      if (earned.length > 0) setNewAchievements(earned);
    };
    const onTick = (d: any) => setTimerSec(d.timeRemaining);
    const onLeft = (d: any) => showNotice(d.message || 'A player left.', false);
    socket.on('raid:sync', onSync); socket.on('raid:player-joined', onJoined);
    socket.on('raid:damage', onDamage); socket.on('raid:end', onEnd);
    socket.on('raid:tick', onTick); socket.on('raid:player-left', onLeft);
    return () => {
      socket.off('raid:sync', onSync); socket.off('raid:player-joined', onJoined);
      socket.off('raid:damage', onDamage); socket.off('raid:end', onEnd);
      socket.off('raid:tick', onTick); socket.off('raid:player-left', onLeft);
    };
  }, [active, questions.length, user, maxStreak, timerSec]);

  useEffect(() => {
    if (!connected || !user || !raidState?.id || joinedRef.current === raidState.id) return;
    socketRef.current?.emit('raid:join', { raidId: raidState.id, player: { id: user.id, username: user.username, heroClass: user.heroClass } });
    joinedRef.current = raidState.id;
  }, [connected, raidState?.id, user]);

  function startTimer() { setTimerSec(RAID_DURATION); timerRef.current = setInterval(() => setTimerSec(t => Math.max(0, t - 1)), 1000); }
  function stopTimer()  { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  useEffect(() => () => stopTimer(), []);
  function showNotice(msg: string, ok: boolean) { setNotice(msg); setNoticeOk(ok); }

  async function fetchDM(params: any) {
    setDmLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/ai/dungeon-master`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, heroClass: user?.heroClass }) });
      const data = await res.json();
      if (data?.beat) setDmBeat(data.beat);
    } catch {} finally { setDmLoading(false); }
  }

  async function createRaid() {
    if (!user) return;
    setLoading(true); setSummary(null); setDmBeat(null); setMaxStreak(0);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const heroStats = HERO_STATS[user.heroClass as HeroClass];
      const { raid } = await api.startRaid({ raidId: code, leaderId: user.id, monsterHp: selectedBoss.hp, teamHp: heroStats?.maxHp || 100, monsterName: selectedBoss.name });
      setRaidState(raid); setCodeInput(code); joinedRef.current = null;
      setQIndex(0); setActive(true); startTimer();
      showNotice(`⚔️ Raid ${code} created — share this code with teammates!`, true);
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  async function joinRaid() {
    if (!user || !codeInput.trim()) return;
    setLoading(true); setSummary(null); setDmBeat(null);
    try {
      const { raid } = await api.getRaid(codeInput.trim().toUpperCase());
      if (!raid) { showNotice('No raid found for that code. Ask your teammate to create one first.', false); setLoading(false); return; }
      setRaidState(raid); joinedRef.current = null;
      setQIndex(0); setActive(true); startTimer();
      showNotice(`Joined raid ${raid.id}! Syncing with team...`, true);
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  function answer(idx: number) {
    if (!user || !raidState || awaiting) return;
    const q = questions[qIndex];
    if (!q) return;
    const isCorrect = idx === q.correct;
    const dmg = calcDamage(user.heroClass as HeroClass, raidState.streak || 0);
    setAwaiting(true);
    showNotice(isCorrect ? `✅ ${q.explanation}` : `❌ Wrong. ${q.explanation}`, isCorrect);
    socketRef.current?.emit('raid:answer', { raidId: raidState.id, isCorrect, damage: dmg, subject: q.subject, concept: q.concept });
    fetchDM({ isCorrect, streak: (raidState.streak || 0) + (isCorrect ? 1 : 0), subject: q.subject, concept: q.concept, difficulty });
  }

  if (!user) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center"><p className="text-gray-400 mb-4">Create a hero first</p>
        <Link href="/" className="bg-white/10 px-5 py-3 rounded-xl font-semibold hover:bg-white/15">← Home</Link></div>
    </main>
  );

  const mins = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const secs = String(timerSec % 60).padStart(2, '0');
  const urgent = timerSec <= 30;
  const heroStats = HERO_STATS[user.heroClass as HeroClass] || HERO_STATS.mage;

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (!active) return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} onDone={() => setNewAchievements([])} />}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">← Back</Link>
        <h1 className="text-2xl font-black">⚔️ Raid Arena</h1>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-bold ${connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}`}>
          {connected ? '🟢 Live' : '🔴 Connecting...'}
        </span>
      </div>

      {/* Boss selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
        <p className="text-sm text-gray-400 mb-3 font-semibold">Select Your Boss</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {BOSSES.map(boss => (
            <button key={boss.id} onClick={() => setSelectedBoss(boss)}
              className={`rounded-xl p-3 border-2 text-center transition-all ${selectedBoss.id === boss.id ? 'border-rose-500 bg-rose-500/10 scale-105' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
              <div className="text-2xl mb-1">{boss.icon}</div>
              <p className="text-xs font-bold leading-tight">{boss.name}</p>
              <p className="text-[10px] text-rose-400 mt-0.5">{boss.hp} HP</p>
            </button>
          ))}
        </div>
        {selectedBoss && (
          <p className="text-xs text-gray-500 mt-2 text-center">{selectedBoss.desc}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-white font-bold mb-1">Create a Raid Room</p>
          <p className="text-xs text-gray-500 mb-4">Get a code — share it so teammates can join you</p>
          <button onClick={createRaid} disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 font-black py-4 rounded-xl uppercase tracking-widest text-sm disabled:opacity-50 hover:scale-[1.01] transition shadow-lg shadow-rose-500/20">
            {loading ? 'Opening Arena...' : `⚔️ Fight ${selectedBoss.icon} ${selectedBoss.name}`}
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-white font-bold mb-1">Join a Teammate's Raid</p>
          <p className="text-xs text-gray-500 mb-4">Enter the 6-letter code they shared with you</p>
          <div className="flex gap-2">
            <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())}
              placeholder="AB12CD" maxLength={6}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-lg outline-none focus:border-cyan-500 uppercase tracking-widest text-center" />
            <button onClick={joinRaid} disabled={loading || codeInput.length < 4}
              className="bg-cyan-500 hover:bg-cyan-400 px-6 rounded-xl font-black disabled:opacity-50 transition">
              Join
            </button>
          </div>
        </div>
      </div>

      {notice && <div className={`rounded-xl px-4 py-3 text-sm mb-4 border font-semibold ${noticeOk ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>{notice}</div>}

      {summary && (
        <div className={`rounded-2xl p-6 border mb-4 ${summary.status === 'victory' ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border-emerald-500/30' : 'bg-gradient-to-br from-red-900/40 to-rose-900/20 border-red-500/30'}`}>
          <h2 className="text-3xl font-black mb-1">{summary.status === 'victory' ? '🏆 Victory!' : '💀 Defeated'}</h2>
          <p className="text-gray-400 text-sm mb-4">{summary.status === 'victory' ? 'You conquered the boss!' : 'The boss was too strong this time.'}</p>
          <div className="grid grid-cols-3 gap-3">
            {[['XP Earned', `+${summary.xpReward}`, 'text-amber-400'], ['Correct', summary.correctAnswers, 'text-emerald-400'], ['Total Dmg', summary.totalDamage, 'text-rose-400']].map(([k, v, c]) => (
              <div key={k} className="bg-black/30 rounded-xl p-3 text-center">
                <p className={`text-2xl font-black ${c}`}>{v}</p>
                <p className="text-xs text-gray-500 mt-1">{k}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[['Class', `${heroStats.icon} ${user.heroClass}`], ['Subject', heroStats.subject], ['Tier', `Difficulty ${difficulty}`]].map(([k, v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="font-bold capitalize text-sm">{v}</p><p className="text-xs text-gray-600 mt-0.5">{k}</p>
          </div>
        ))}
      </div>
    </main>
  );

  // ── Battle ─────────────────────────────────────────────────────────────────
  const r = raidState;
  const q = questions[qIndex];

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} onDone={() => setNewAchievements([])} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition">←</Link>
          <h1 className="text-xl font-black">{r?.monsterName || 'Boss Battle'}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(r?.streak || 0) >= 2 && (
            <span className={`font-black text-sm px-3 py-1 rounded-full border ${r.streak >= 5 ? 'border-orange-400/60 bg-orange-400/20 text-orange-200 animate-pulse' : 'border-amber-400/40 bg-amber-400/10 text-amber-200'}`}>
              🔥 {r.streak}× Combo
            </span>
          )}
          <span className={`font-black text-sm px-3 py-1.5 rounded-full border ${urgent ? 'border-red-400/60 bg-red-400/20 text-red-200 animate-pulse' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
            ⏱ {mins}:{secs}
          </span>
          <span className="bg-gray-800 text-gray-500 px-3 py-1 rounded-full text-xs font-mono border border-gray-700">{r?.id}</span>
        </div>
      </div>

      {/* HP bars */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 relative">
          <HPBar label={`${selectedBoss.icon} Boss HP`} current={r?.monsterHp || 0} max={r?.monsterMaxHp || 100} color="red" />
          {lastDamage?.type === 'player-attack' && (
            <div className="absolute top-2 right-4 text-emerald-300 font-black text-2xl animate-bounce pointer-events-none">−{lastDamage.value}</div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 relative">
          <HPBar label="🛡️ Team HP" current={r?.teamHp || 0} max={r?.teamMaxHp || 100} color="green" />
          {lastDamage?.type === 'monster-attack' && (
            <div className="absolute top-2 right-4 text-rose-300 font-black text-2xl animate-bounce pointer-events-none">−{lastDamage.value}</div>
          )}
        </div>
      </div>

      {notice && (
        <div className={`rounded-xl px-4 py-2.5 text-sm mb-4 font-semibold border ${noticeOk ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
          {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        <div className="space-y-4">
          {/* Question card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            {q ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">Question {qIndex + 1} / {questions.length}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full capitalize">{q.subject}</span>
                    <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full">Tier {q.difficulty}</span>
                  </div>
                </div>
                <p className="text-lg font-bold leading-7 mb-5 text-white">{q.body}</p>
                <div className="grid gap-2">
                  {q.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => answer(i)} disabled={awaiting || !connected}
                      className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 px-4 py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                      <span className="inline-flex w-7 h-7 bg-gray-700 group-hover:bg-cyan-500/30 rounded-full items-center justify-center text-xs font-black mr-3 transition">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                {!connected && <p className="text-amber-400 text-xs mt-3">⚠️ Reconnecting to server...</p>}
              </>
            ) : <p className="text-gray-500 text-center py-8">Loading questions...</p>}
          </div>

          {/* AI Dungeon Master */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">🤖 AI Dungeon Master</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${dmBeat?.source === 'huggingface' ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800 text-gray-500'}`}>
                {dmBeat?.source || 'waiting'}
              </span>
            </div>
            {dmLoading ? (
              <p className="text-gray-500 text-sm animate-pulse">The Dungeon Master watches the battle...</p>
            ) : dmBeat ? (
              <div className="space-y-2 text-sm leading-6">
                <p><span className="text-cyan-300 font-bold">⚔️ </span><span className="text-gray-200">{dmBeat.narration}</span></p>
                <p><span className="text-emerald-300 font-bold">💡 </span><span className="text-gray-300">{dmBeat.hint}</span></p>
                <p><span className="text-amber-300 font-bold">📖 </span><span className="text-gray-400">{dmBeat.explanation}</span></p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Answer a question to receive live narration, hints, and explanations.</p>
            )}
          </div>
        </div>

        {/* Squad sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm font-semibold mb-3">Squad · {r?.players?.length || 0} players</p>
          <div className="space-y-2 mb-4">
            {(r?.players || []).map((p: any) => {
              const prog = r?.playerProgress?.[p.id] || { damageDealt: 0, correctAnswers: 0 };
              const isMe = p.id === user.id;
              const ph   = HERO_STATS[p.heroClass as HeroClass] || HERO_STATS.mage;
              return (
                <div key={p.id} className={`rounded-xl p-3 border ${isMe ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-gray-700 bg-gray-800'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ph.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{p.username}{isMe ? ' (you)' : ''}</p>
                        <p className="text-xs text-gray-500 capitalize">{p.heroClass}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-300 text-sm font-black">{prog.damageDealt}</p>
                      <p className="text-xs text-gray-600">dmg</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (prog.correctAnswers / Math.max(r?.questionsAnswered || 1, 1)) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-800 pt-3 space-y-2.5">
            {[
              ['Streak',     r?.streak || 0],
              ['Correct',    `${r?.correctAnswers || 0} / ${r?.questionsAnswered || 0}`],
              ['Accuracy',   r?.questionsAnswered > 0 ? `${Math.round((r.correctAnswers / r.questionsAnswered) * 100)}%` : '—'],
              ['Difficulty', `Tier ${difficulty}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-600">{k}</span>
                <span className="font-bold text-white">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}