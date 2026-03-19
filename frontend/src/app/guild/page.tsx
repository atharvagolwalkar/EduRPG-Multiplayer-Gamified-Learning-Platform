'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function GuildPage() {
  const { user, updateUser } = useGameStore();
  const [guilds, setGuilds]     = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [notice, setNotice]     = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { api.getGuilds().then(d => setGuilds(d.guilds || [])).catch(() => {}); }, []);

  async function create() {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { guild } = await api.createGuild({ name: name.trim(), description: desc.trim(), leaderId: user.id });
      setGuilds(g => [guild, ...g]); setSelected(guild);
      updateUser({ guildId: guild.id });
      setShowForm(false); setName(''); setDesc(''); setNotice('Guild created!');
    } catch (e: any) { setNotice(e.message); } finally { setLoading(false); }
  }

  async function join(guildId: string) {
    if (!user) return;
    setLoading(true);
    try {
      const { guild } = await api.joinGuild(guildId, user.id);
      setGuilds(gs => gs.map(g => g.id === guildId ? guild : g));
      setSelected(guild); updateUser({ guildId: guild.id });
      setNotice(`Joined ${guild.name}!`);
    } catch (e: any) { setNotice(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/15">← Back</Link>
        <h1 className="text-2xl font-black">🏛️ Guild Hall</h1>
      </div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <div>
          <h2 className="text-4xl font-black mb-2">Build a learning squad.</h2>
          <p className="text-gray-400">Join a guild to share XP, raid together, and climb the guild leaderboard.</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[['Guilds', guilds.length], ['Your guild', user?.guildId ? 'Joined' : 'None'], ['Max size', 50]].map(([k, v]) => (
              <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="font-black text-lg">{v}</p><p className="text-xs text-gray-500">{k}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">Start a guild</p>
            <button onClick={() => setShowForm(v => !v)} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/15">{showForm ? 'Cancel' : '+ Create'}</button>
          </div>
          {showForm ? (
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Guild name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500 resize-none" />
              <button onClick={create} disabled={!name.trim() || !user || loading} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 hover:scale-[1.01] transition">{loading ? 'Creating...' : 'Launch Guild'}</button>
            </div>
          ) : selected ? (
            <div>
              <h3 className="text-xl font-black mb-1">{selected.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{selected.description || 'No description.'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[['Members', selected.memberCount], ['XP', selected.xp], ['Level', selected.level]].map(([k, v]) => (
                  <div key={k} className="bg-gray-800 rounded-lg p-2 text-center"><p className="font-black">{v}</p><p className="text-xs text-gray-500">{k}</p></div>
                ))}
              </div>
              {user?.guildId !== selected.id
                ? <button onClick={() => join(selected.id)} disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-sky-500 text-black font-black py-2.5 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50">{loading ? 'Joining...' : 'Join Guild'}</button>
                : <p className="text-emerald-400 text-sm text-center font-bold">✅ You are a member</p>}
            </div>
          ) : <p className="text-gray-500 text-sm">Select a guild card below.</p>}
          {notice && <p className="mt-3 text-sm text-cyan-300">{notice}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guilds.map(g => (
          <button key={g.id} onClick={() => setSelected(g)} className={`bg-gray-900 border rounded-2xl p-5 text-left hover:-translate-y-1 transition ${selected?.id === g.id ? 'border-cyan-400' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-xs text-gray-500 mb-1">Guild</p><h3 className="text-xl font-black">{g.name}</h3></div>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-sky-600 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            </div>
            <p className="text-sm text-gray-400 mb-3">{g.description || 'A learning squad.'}</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Members', g.memberCount], ['XP', g.xp], ['Lv', g.level]].map(([k, v]) => (
                <div key={k} className="bg-gray-800 rounded-lg p-2 text-center"><p className="font-black text-sm">{v}</p><p className="text-xs text-gray-600">{k}</p></div>
              ))}
            </div>
          </button>
        ))}
        {guilds.length === 0 && <p className="text-gray-600 col-span-3 text-center py-12">No guilds yet — create the first one!</p>}
      </div>
    </main>
  );
}