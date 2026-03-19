const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  createUser: (body: { username: string; heroClass: string }) =>
    apiFetch<{ user: any }>('/api/users/create', { method: 'POST', body: JSON.stringify(body) }),

  getUser: (id: string) =>
    apiFetch<{ user: any }>(`/api/users/${id}`),

  getUsers: () =>
    apiFetch<{ users: any[] }>('/api/users'),

  startRaid: (body: any) =>
    apiFetch<{ raid: any }>('/api/raids/start', { method: 'POST', body: JSON.stringify(body) }),

  getRaid: (id: string) =>
    apiFetch<{ raid: any }>(`/api/raids/${id}`),

  createGuild: (body: { name: string; description?: string; leaderId: string }) =>
    apiFetch<{ guild: any }>('/api/guilds/create', { method: 'POST', body: JSON.stringify(body) }),

  getGuilds: () =>
    apiFetch<{ guilds: any[] }>('/api/guilds'),

  joinGuild: (guildId: string, userId: string) =>
    apiFetch<{ guild: any }>(`/api/guilds/${guildId}/join`, { method: 'POST', body: JSON.stringify({ userId }) }),

  getLeaderboard: (type: 'global' | 'guilds' | 'weekly' = 'global') =>
    apiFetch<{ leaderboard: any[] }>(`/api/leaderboard/${type}`),

  getQuestions: (heroClass: string, difficulty = 1) =>
    apiFetch<{ questions: any[] }>(`/api/questions?heroClass=${heroClass}&difficulty=${difficulty}`),
};