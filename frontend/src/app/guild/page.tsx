'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function GuildPage() {
  const { user, updateUser } = useStore();
  const [guilds,    setGuilds]    = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any>(null);
  const [name,      setName]      = useState('');
  const [desc,      setDesc]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [notice,    setNotice]    = useState('');
  const [showForm,  setShowForm]  = useState(false);

  useEffect(() => { api.getGuilds().then(d => setGuilds(d.guilds||[])).catch(()=>{}); }, []);

  async function create() {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { guild } = await api.createGuild({
        name: name.trim(), description: desc.trim(),
        leaderId: ''
      });
      setGuilds(g => [guild,...g]); setSelected(guild); updateUser({ guildId: guild.id });
      setShowForm(false); setName(''); setDesc(''); setNotice('Guild created! 🎉');
    } catch (e: any) { setNotice(e.message); } finally { setLoading(false); }
  }

  async function join(id: string) {
    if (!user) return;
    setLoading(true);
    try {
      const { guild } = await api.joinGuild(id);
      setGuilds(gs => gs.map(g => g.id===id ? guild : g)); setSelected(guild); updateUser({ guildId: guild.id });
      setNotice(`Joined ${guild.name}! 🏛️`);
    } catch (e: any) { setNotice(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="glass px-4 py-2 rounded-xl text-sm hover:bg-white/10">← Back</Link>
        <h1 className="text-2xl font-black">🏛️ Guild Hall</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-5 mb-6">
        <div>
          <h2 className="text-4xl font-black mb-2 leading-tight">Build a squad.<br/>Conquer together.</h2>
          <p className="text-slate-400 mb-4">Guilds share XP from every raid. Climb the guild leaderboard as a team.</p>
          <div className="grid grid-cols-3 gap-3">
            {[['Active Guilds', guilds.length], ['Your Guild', user?.guildId ? '✅' : 'None'], ['Max Members', 50]].map(([k,v]) => (
              <div key={k} className="glass rounded-xl p-3 text-center">
                <p className="text-xl font-black">{v}</p><p className="text-xs text-slate-500 mt-0.5">{k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">Create a guild</p>
            <button onClick={() => setShowForm(v=>!v)} className="text-xs glass px-3 py-1.5 rounded-lg hover:bg-white/10">{showForm?'Cancel':'+ New'}</button>
          </div>
          {showForm ? (
            <div className="space-y-3">
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Guild name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describe your guild..." rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 resize-none" />
              <button onClick={create} disabled={!name.trim()||!user||loading} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50">{loading?'...':'Launch Guild'}</button>
            </div>
          ) : selected ? (
            <div>
              <h3 className="text-xl font-black">{selected.name}</h3>
              <p className="text-slate-400 text-sm mt-1 mb-3">{selected.description||'No description.'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[['Members', selected.member_count||selected.memberCount], ['XP', selected.xp], ['Lv', selected.level]].map(([k,v])=>(
                  <div key={k} className="bg-slate-800 rounded-lg p-2 text-center"><p className="font-black">{v}</p><p className="text-xs text-slate-600">{k}</p></div>
                ))}
              </div>
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-2">Members</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {(selected.members||[]).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between text-sm bg-slate-800/60 rounded-lg px-3 py-1.5">
                      <span className="font-semibold">{m.username}</span>
                      <span className="text-xs text-slate-500 capitalize">{m.hero_class}</span>
                    </div>
                  ))}
                </div>
              </div>
              {user?.guildId !== selected.id
                ? <button onClick={()=>join(selected.id)} disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-sky-500 text-black font-black py-2.5 rounded-xl text-sm uppercase disabled:opacity-50">{loading?'...':'Join Guild'}</button>
                : <p className="text-emerald-400 text-sm text-center font-bold">✅ You are a member</p>}
            </div>
          ) : <p className="text-slate-600 text-sm">Select a guild to inspect it, or create one.</p>}
          {notice && <p className="mt-3 text-sm text-cyan-300">{notice}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guilds.map(g => (
          <button key={g.id} onClick={()=>setSelected(g)}
            className={`glass rounded-2xl p-5 text-left hover:-translate-y-1 transition ${selected?.id===g.id?'border-cyan-400/60':'hover:border-white/20'}`}>
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-xs text-slate-500 mb-1">Guild</p><h3 className="text-xl font-black">{g.name}</h3></div>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-sky-600 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            </div>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{g.description||'A powerful learning squad.'}</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Members', g.member_count||g.memberCount||1], ['XP', g.xp], ['Lv', g.level]].map(([k,v])=>(
                <div key={k} className="bg-slate-800/80 rounded-lg p-2 text-center"><p className="font-black text-sm">{v}</p><p className="text-xs text-slate-600">{k}</p></div>
              ))}
            </div>
            {user?.guildId === g.id && <p className="text-emerald-400 text-xs mt-2 font-bold">✅ Your guild</p>}
          </button>
        ))}
        {guilds.length===0 && <p className="text-slate-600 text-center py-12 col-span-3">No guilds yet — be the first to create one!</p>}
      </div>
    </main>
  );
}