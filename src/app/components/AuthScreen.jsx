import { useState } from 'react';
import { Search, LogIn, UserPlus } from 'lucide-react';
import { api, setToken } from '../api';

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = mode === 'login'
        ? await api.login({ usernameOrEmail: form.username, password: form.password })
        : await api.register(form);
      setToken(result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-slate-100">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Phrases Detective</h1>
            <p className="text-sm text-slate-500">Sačuvaj napredak i takmiči se</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg mb-6">
          <button onClick={() => setMode('login')} className={`py-2 rounded-md font-semibold ${mode === 'login' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>Prijava</button>
          <button onClick={() => setMode('register')} className={`py-2 rounded-md font-semibold ${mode === 'register' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>Registracija</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">{mode === 'login' ? 'Korisničko ime ili email' : 'Korisničko ime'}</span>
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-3 outline-none focus:border-blue-500" />
          </label>
          {mode === 'register' && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-3 outline-none focus:border-blue-500" />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Lozinka</span>
            <input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-3 outline-none focus:border-blue-500" />
          </label>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2">
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {loading ? 'Sačekaj...' : mode === 'login' ? 'Prijavi se' : 'Napravi nalog'}
          </button>
        </form>
      </div>
    </div>
  );
}
