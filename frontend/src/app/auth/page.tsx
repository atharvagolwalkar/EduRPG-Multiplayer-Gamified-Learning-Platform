// "use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { useGameStore } from '../../lib/store';

const HERO_CLASS_OPTIONS = ['mage', 'engineer', 'scientist'] as const;

type HeroClass = (typeof HERO_CLASS_OPTIONS)[number];
type AppUser = {
  id: string;
  email: string;
  username: string;
  heroClass: HeroClass;
  level: number;
  xp: number;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroClass, setHeroClass] = useState<HeroClass>('mage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useGameStore((state) => state.setUser);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!auth) {
      setError('Firebase is not configured correctly.');
      setLoading(false);
      return;
    }

    try {
      let firebaseUser: User;

      if (isLogin) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = credential.user;
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = credential.user;
      }

      const idToken = await firebaseUser.getIdToken();
      const authHeaders = {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      };

      if (!isLogin) {
        const registerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ username, heroClass }),
        });

        if (!registerResponse.ok) {
          const payload = await registerResponse.json().catch(() => null);
          throw new Error(payload?.error || 'Unable to create your profile.');
        }
      }

      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/${firebaseUser.uid}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const profilePayload = profileResponse.ok ? await profileResponse.json() : null;
      const storedUser: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username:
          profilePayload?.user?.username ||
          username ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Player',
        heroClass: (profilePayload?.user?.heroClass as HeroClass) || heroClass,
        level: profilePayload?.user?.level || 1,
        xp: profilePayload?.user?.xp || 0,
      };
      
      // Store
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('user', JSON.stringify(storedUser));
      setUser(storedUser);
      
      router.push('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroClassChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setHeroClass(e.target.value as HeroClass);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                required={!isLogin}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              required
            />
          </div>
          {!isLogin && (
            <div className="mb-4">
              <label className="block mb-2">Choose your Hero Class</label>
              <select
                value={heroClass}
                onChange={handleHeroClassChange}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              >
                <option value="mage">Mage (Mathematics)</option>
                <option value="engineer">Engineer (Programming)</option>
                <option value="scientist">Scientist (Physics/Data Science)</option>
              </select>
            </div>
          )}
          {error && <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 p-3 rounded font-bold">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:underline ml-2">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
