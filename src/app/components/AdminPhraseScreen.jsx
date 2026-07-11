import { useCallback, useEffect, useState } from 'react';
import { Edit3, LogOut, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { api } from '../api';

const emptyForm = {
  phrase: '', difficulty: 'MEDIUM', correctAnswer: '',
  wrongAnswer1: '', wrongAnswer2: '', wrongAnswer3: '',
};

const difficultyLabels = { EASY: 'Laka', MEDIUM: 'Srednja', HARD: 'Teška' };

export function AdminPhraseScreen({ onLogout }) {
  const [phrases, setPhrases] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPhrases = useCallback(async (search = '') => {
    setLoading(true);
    setError('');
    try {
      setPhrases(await api.adminPhrases(search));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadPhrases(query), 250);
    return () => window.clearTimeout(timer);
  }, [query, loadPhrases]);

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const edit = (phrase) => {
    setEditingId(phrase.id);
    setForm({
      phrase: phrase.phrase,
      difficulty: phrase.difficulty,
      correctAnswer: phrase.correctAnswer,
      wrongAnswer1: phrase.wrongAnswer1,
      wrongAnswer2: phrase.wrongAnswer2,
      wrongAnswer3: phrase.wrongAnswer3,
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await api.updatePhrase(editingId, form);
        setMessage('Fraza je uspješno izmijenjena.');
      } else {
        await api.createPhrase(form);
        setMessage('Fraza je uspješno dodata.');
      }
      resetForm();
      await loadPhrases(query);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (phrase) => {
    if (!window.confirm(`Da li sigurno želiš da obrišeš frazu „${phrase.phrase}“?`)) return;
    setError('');
    setMessage('');
    try {
      await api.deletePhrase(phrase.id);
      if (editingId === phrase.id) resetForm();
      setMessage('Fraza je obrisana.');
      await loadPhrases(query);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Administracija</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Upravljanje frazama</h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-600 shadow-sm hover:text-red-600">
            <LogOut className="h-5 w-5" /> <span className="hidden sm:inline">Odjava</span>
          </button>
        </header>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              {editingId ? <Edit3 className="h-5 w-5 text-purple-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
              {editingId ? 'Izmijeni frazu' : 'Dodaj novu frazu'}
            </h2>
            {editingId && <button type="button" onClick={resetForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Engleska fraza" value={form.phrase} onChange={(value) => change('phrase', value)} placeholder="npr. Cost an arm and a leg" />
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Težina</span>
              <select value={form.difficulty} onChange={(e) => change('difficulty', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500">
                <option value="EASY">Laka</option><option value="MEDIUM">Srednja</option><option value="HARD">Teška</option>
              </select>
            </label>
            <Field label="Tačan odgovor" value={form.correctAnswer} onChange={(value) => change('correctAnswer', value)} tone="green" />
            <Field label="Prvi netačan odgovor" value={form.wrongAnswer1} onChange={(value) => change('wrongAnswer1', value)} tone="red" />
            <Field label="Drugi netačan odgovor" value={form.wrongAnswer2} onChange={(value) => change('wrongAnswer2', value)} tone="red" />
            <Field label="Treći netačan odgovor" value={form.wrongAnswer3} onChange={(value) => change('wrongAnswer3', value)} tone="red" />
          </div>

          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {message && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</p>}
          <button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-black text-white shadow-md disabled:opacity-60 md:w-auto md:px-8">
            <Save className="h-5 w-5" /> {saving ? 'Čuvanje...' : editingId ? 'Sačuvaj izmjene' : 'Dodaj frazu'}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-black text-slate-900">Fraze u bazi</h2><p className="text-sm text-slate-500">Pronađeno: {phrases.length}</p></div>
            <label className="relative block w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži frazu ili odgovor..." className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 outline-none focus:border-blue-500" />
              {query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-5 w-5" /></button>}
            </label>
          </div>

          {loading ? <p className="py-10 text-center font-bold text-slate-500">Učitavanje...</p> : phrases.length === 0 ? <p className="py-10 text-center font-bold text-slate-500">Nema pronađenih fraza.</p> : (
            <div className="grid gap-3">
              {phrases.map((phrase) => (
                <article key={phrase.id} className="rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-black text-slate-900">{phrase.phrase}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{difficultyLabels[phrase.difficulty]}</span>
                      </div>
                      <p className="text-sm font-bold text-green-700">Tačno: {phrase.correctAnswer}</p>
                      <p className="mt-1 text-sm text-slate-500">Netačno: {phrase.wrongAnswer1} · {phrase.wrongAnswer2} · {phrase.wrongAnswer3}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => edit(phrase)} title="Izmijeni" className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"><Edit3 className="h-5 w-5" /></button>
                      <button onClick={() => remove(phrase)} title="Obriši" className="rounded-lg p-2 text-red-600 hover:bg-red-100"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '', tone = 'slate' }) {
  const focus = tone === 'green' ? 'focus:border-green-500' : tone === 'red' ? 'focus:border-red-400' : 'focus:border-blue-500';
  return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-700">{label}</span><input required maxLength={255} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl border border-slate-300 px-3 py-3 outline-none ${focus}`} /></label>;
}
