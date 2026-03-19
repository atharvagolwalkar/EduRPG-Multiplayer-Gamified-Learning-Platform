'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getRaidSocket } from '@/lib/socket';
import { HERO_STATS, calcDamage } from '@/lib/game';

const RAID_DURATION = 180;

function HPBar({ label, current, max, color }: { label: string; current: number; max: number; color: 'red' | 'green' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const bar = color === 'red'
    ? pct > 50 ? 'bg-rose-500' : pct > 25 ? 'bg-orange-500' : 'bg-red-700'
    : pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-400' : 'bg-red-600';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="font-bold">{Math.ceil(current)}/{max}</span>
      </div>
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RaidPage() {
  const { user, updateUser } = useGameStore();
  const [questions, setQuestions]     = useState<any[]>([]);
  const [qIndex, setQIndex]           = useState(0);
  const [raidState, setRaidState]     = useState<any>(null);
  const [connected, setConnected]     = useState(false);
  const [active, setActive]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [codeInput, setCodeInput]     = useState('');
  const [notice, setNotice]           = useState('');
  const [noticeOk, setNoticeOk]       = useState(true);
  const [awaiting, setAwaiting]       = useState(false);
  const [summary, setSummary]         = useState<any>(null);
  const [timerSec, setTimerSec]       = useState(RAID_DURATION);
  const [difficulty, setDifficulty]   = useState(1);
  const timerRef  = useRef<any>(null);
  const joinedRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

  // Load questions when difficulty/user changes
  useEffect(() => {
    if (!user) return;
    api.getQuestions(user.heroClass, difficulty)
      .then(d => setQuestions(d.questions || []))
      .catch(() => {});
  }, [user, difficulty]);

  // Socket setup
  useEffect(() => {
    const socket = getRaidSocket();
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    if (socket.connected) setConnected(true);
    return () => { socket.off('connect'); socket.off('disconnect'); };
  }, []);

  // Socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !active) return;

    const onSync    = (d: any) => setRaidState(d.raid);
    const onJoined  = (d: any) => { setRaidState(d.raid); showNotice(d.message || 'Player joined!', true); };
    const onDamage  = (d: any) => {
      setRaidState(d.raid);
      showNotice(d.message || '', d.type === 'player-attack');
      if (d.adaptiveSignal === 'increase') setDifficulty(v => Math.min(5, v + 1));
      if (d.adaptiveSignal === 'decrease') setDifficulty(v => Math.max(1, v - 1));
      setTimeout(() => { setAwaiting(false); setQIndex(i => (i + 1 < questions.length ? i + 1 : 0)); }, 800);
    };
    const onEnd     = (d: any) => {
      setRaidState({ ...d.raid, status: d.status });
      setSummary(d);
      setActive(false);
      stopTimer();
      if (d.xpReward && user) updateUser({ xp: (user.xp || 0) + d.xpReward, totalXp: (user.totalXp || 0) + d.xpReward });
    };
    const onTick    = (d: any) => setTimerSec(d.timeRemaining);
    const onLeft    = (d: any) => showNotice(d.message || 'A player left.', false);

    socket.on('raid:sync',          onSync);
    socket.on('raid:player-joined', onJoined);
    socket.on('raid:damage',        onDamage);
    socket.on('raid:end',           onEnd);
    socket.on('raid:tick',          onTick);
    socket.on('raid:player-left',   onLeft);

    return () => {
      socket.off('raid:sync',          onSync);
      socket.off('raid:player-joined', onJoined);
      socket.off('raid:damage',        onDamage);
      socket.off('raid:end',           onEnd);
      socket.off('raid:tick',          onTick);
      socket.off('raid:player-left',   onLeft);
    };
  }, [active, questions.length, user]);

  // Auto-join socket room
  useEffect(() => {
    if (!connected || !user || !raidState?.id || joinedRef.current === raidState.id) return;
    socketRef.current?.emit('raid:join', { raidId: raidState.id, player: { id: user.id, username: user.username, heroClass: user.heroClass } });
    joinedRef.current = raidState.id;
  }, [connected, raidState?.id, user]);

  function startTimer() {
    setTimerSec(RAID_DURATION);
    timerRef.current = setInterval(() => setTimerSec(t => Math.max(0, t - 1)), 1000);
  }
  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  useEffect(() => () => stopTimer(), []);

  function showNotice(msg: string, ok: boolean) { setNotice(msg); setNoticeOk(ok); }

  async function createRaid() {
    if (!user) return;
    setLoading(true); setSummary(null);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { raid } = await api.startRaid({ raidId: code, leaderId: user.id, monsterHp: 100, teamHp: HERO_STATS[user.heroClass].maxHp, monsterName: 'Calculus Titan', players: [{ id: user.id, username: user.username }] });
      setRaidState(raid); setCodeInput(code); joinedRef.current = null;
      setQIndex(0); setActive(true); startTimer();
      showNotice(`Raid ${code} created — share this code!`, true);
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  async function joinRaid() {
    if (!user || !codeInput.trim()) return;
    setLoading(true); setSummary(null);
    try {
      const { raid } = await api.getRaid(codeInput.trim().toUpperCase());
      if (!raid) { showNotice('Raid not found', false); return; }
      setRaidState(raid); joinedRef.current = null;
      setQIndex(0); setActive(true); startTimer();
      showNotice(`Joined raid ${raid.id}`, true);
    } catch (e: any) { showNotice(e.message, false); }
    finally { setLoading(false); }
  }

  function answer(idx: number) {
    if (!user || !raidState || awaiting) return;
    const q = questions[qIndex];
    if (!q) return;
    const isCorrect = idx === q.correct;
    const dmg = calcDamage(user.heroClass, raidState.streak || 0);
    setAwaiting(true);
    showNotice(isCorrect ? `✅ Correct! ${q.explanation}` : `❌ Wrong. ${q.explanation}`, isCorrect);
    socketRef.current?.emit('raid:answer', { raidId: raidState.id, isCorrect, damage: dmg, subject: q.subject, concept: q.concept });
  }

  if (!user) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Create a hero first</p>
        <Link href="/" className="bg-white/10 px-5 py-3 rounded-xl font-semibold hover:bg-white/15">← Home</Link>
      </div>
    </main>
  );

  const mins = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const secs = String(timerSec % 60).padStart(2, '0');

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (!active) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/15">← Back</Link>
        <h1 className="text-2xl font-black">⚔️ Raid Arena</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-3">Create a new raid room</p>
          <button onClick={createRaid} disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm disabled:opacity-50 hover:scale-[1.02] transition">
            {loading ? 'Opening...' : '⚔️ Create Raid'}
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-3">Join an existing raid</p>
          <div className="flex gap-2">
            <input value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Raid code" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" />
            <button onClick={joinRaid} disabled={loading || !codeInput.trim()}
              className="bg-cyan-500 px-5 py-3 rounded-xl font-bold hover:bg-cyan-400 disabled:opacity-50 transition">
              Join
            </button>
          </div>
        </div>
      </div>

      {notice && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${noticeOk ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-300'}`}>{notice}</div>}

      {summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-3">Last raid result</p>
          <div className="grid grid-cols-3 gap-3">
            {[['Result', summary.status], ['XP earned', summary.xpReward], ['Correct', summary.correctAnswers]].map(([k, v]) => (
              <div key={k} className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xl font-black capitalize">{v}</p>
                <p className="text-xs text-gray-500">{k}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[['Hero', user.username], ['Class', user.heroClass], ['Socket', connected ? '🟢 Live' : '🔴 Connecting']].map(([k, v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="font-bold capitalize">{v}</p>
            <p className="text-xs text-gray-500">{k}</p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-white/10 px-3 py-2 rounded-lg text-sm hover:bg-white/15">←</Link>
          <h1 className="text-xl font-black">{r?.monsterName || 'Boss Battle'}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {r?.streak >= 2 && (
            <span className="bg-orange-500/20 border border-orange-400/40 text-orange-200 px-3 py-1 rounded-full text-sm font-black">
              🔥 COMBO ×{r.streak}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-black ${timerSec <= 30 ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-gray-800 text-gray-300'}`}>
            ⏱ {mins}:{secs}
          </span>
          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs">{r?.id}</span>
        </div>
      </div>

      {/* HP bars */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <HPBar label="Boss HP" current={r?.monsterHp || 0} max={r?.monsterMaxHp || 100} color="red" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <HPBar label="Team HP" current={r?.teamHp || 0} max={r?.teamMaxHp || 100} color="green" />
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${noticeOk ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-300'}`}>
          {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Question */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {q ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">Question {qIndex + 1}/{questions.length}</p>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full capitalize">{q.subject} · tier {q.difficulty}</span>
              </div>
              <p className="text-lg font-bold mb-5 leading-7">{q.body}</p>
              <div className="grid gap-2">
                {q.options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => answer(i)} disabled={awaiting || !connected}
                    className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 px-4 py-3 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="inline-flex w-6 h-6 bg-gray-700 rounded-full items-center justify-center text-xs font-bold mr-3">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {!connected && <p className="text-amber-400 text-xs mt-3">⚠️ Reconnecting to server...</p>}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">Loading questions...</p>
          )}
        </div>

        {/* Squad */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-3">Squad · {r?.players?.length || 0} players</p>
          <div className="space-y-2">
            {(r?.players || []).map((p: any) => {
              const prog = r?.playerProgress?.[p.id] || { damageDealt: 0, correctAnswers: 0 };
              return (
                <div key={p.id} className="bg-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{p.username || p.id}{p.id === user.id ? ' (you)' : ''}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.heroClass}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-300 text-sm font-bold">{prog.damageDealt} dmg</p>
                      <p className="text-xs text-gray-500">{prog.correctAnswers} correct</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
            {[['Streak', r?.streak || 0], ['Correct', r?.correctAnswers || 0], ['Difficulty', `Tier ${difficulty}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}