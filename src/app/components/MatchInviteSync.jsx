import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Swords, X } from 'lucide-react';
import { api } from '../api';

const INVITE_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 1000;

function parseCreatedAt(value) {
  if (!value) return Date.now();
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, (month || 1) - 1, day || 1, hour, minute, second).getTime();
  }
  const text = String(value);
  const date = new Date(text.includes('T') ? text : text.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
}

function inviteStartedAt(match, now, seenAt) {
  const createdAt = parseCreatedAt(match.createdAt);
  if (createdAt > now + 1000) return seenAt || now;
  return createdAt;
}

function secondsLeft(match, now, seenAt) {
  const elapsedMs = Math.max(0, now - inviteStartedAt(match, now, seenAt));
  return Math.max(0, Math.min(15, Math.ceil((INVITE_TIMEOUT_MS - elapsedMs) / 1000)));
}

function difficultyLabel(difficulty) {
  const labels = { EASY: 'Lako', MEDIUM: 'Srednje', HARD: 'Tesko', easy: 'Lako', medium: 'Srednje', hard: 'Tesko' };
  return labels[difficulty] || difficulty || 'Nepoznato';
}

export function MatchInviteSync({ user, onPlayMatch, onChanged }) {
  const [matches, setMatches] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const autoRejected = useRef(new Set());
  const enteredMatches = useRef(new Set());
  const seenAtByMatch = useRef(new Map());

  const refresh = useCallback(async () => {
    if (!user?.username) return;
    const nextMatches = await api.matches();
    const receivedAt = Date.now();
    for (const match of nextMatches) {
      if (match.status === 'PENDING' && !seenAtByMatch.current.has(match.id)) {
        seenAtByMatch.current.set(match.id, receivedAt);
      }
    }
    setMatches(nextMatches);
  }, [user?.username]);

  useEffect(() => {
    if (!user?.username) return undefined;

    refresh().catch(() => {});
    const poll = window.setInterval(() => {
      refresh().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(poll);
  }, [refresh, user?.username]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const incomingInvite = useMemo(() => {
    return matches
      .filter((match) => match.status === 'PENDING' && match.opponent?.username === user?.username)
      .sort((first, second) => parseCreatedAt(first.createdAt) - parseCreatedAt(second.createdAt))[0] || null;
  }, [matches, user?.username]);

  const outgoingInvite = useMemo(() => {
    return matches
      .filter((match) => match.status === 'PENDING' && match.challenger?.username === user?.username)
      .sort((first, second) => parseCreatedAt(first.createdAt) - parseCreatedAt(second.createdAt))[0] || null;
  }, [matches, user?.username]);

  const acceptedOutgoingMatch = useMemo(() => {
    return matches.find((match) => (
      match.status === 'ACCEPTED' &&
      match.challenger?.username === user?.username &&
      match.challengerScore == null
    )) || null;
  }, [matches, user?.username]);

  const respond = useCallback(async (match, accept) => {
    if (!match || busyId) return;
    setBusyId(match.id);
    setMessage('');
    try {
      const updated = accept ? await api.acceptMatch(match.id) : await api.rejectMatch(match.id);
      await refresh();
      await onChanged?.();
      if (accept) onPlayMatch?.(updated.id);
    } catch (err) {
      setMessage(err.message);
      await refresh().catch(() => {});
    } finally {
      setBusyId(null);
    }
  }, [busyId, onChanged, onPlayMatch, refresh]);

  useEffect(() => {
    if (!incomingInvite) return;
    if (secondsLeft(incomingInvite, now, seenAtByMatch.current.get(incomingInvite.id)) > 0) return;
    if (busyId === incomingInvite.id) return;
    if (autoRejected.current.has(incomingInvite.id)) return;

    autoRejected.current.add(incomingInvite.id);
    respond(incomingInvite, false);
  }, [busyId, incomingInvite, now, respond]);

  useEffect(() => {
    if (!outgoingInvite || secondsLeft(outgoingInvite, now, seenAtByMatch.current.get(outgoingInvite.id)) > 0) return;
    refresh().catch(() => {});
  }, [outgoingInvite, now, refresh]);

  useEffect(() => {
    if (!acceptedOutgoingMatch) return;
    if (enteredMatches.current.has(acceptedOutgoingMatch.id)) return;

    enteredMatches.current.add(acceptedOutgoingMatch.id);
    onPlayMatch?.(acceptedOutgoingMatch.id);
  }, [acceptedOutgoingMatch, onPlayMatch]);

  if (!user) return null;

  const incomingSeconds = incomingInvite ? secondsLeft(incomingInvite, now, seenAtByMatch.current.get(incomingInvite.id)) : 0;
  const outgoingSeconds = outgoingInvite ? secondsLeft(outgoingInvite, now, seenAtByMatch.current.get(outgoingInvite.id)) : 0;

  return (
    <>
      {incomingInvite && incomingSeconds > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md grid place-items-center p-4">
          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/40">
            <div className="relative bg-white px-5 py-5 text-slate-950">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400" />
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500 shadow-lg shadow-violet-950/30">
                  <Swords className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-600">Novi Versus izazov</p>
                  <h2 className="truncate text-2xl font-black leading-tight">{incomingInvite.challenger?.username || 'Igrač'}</h2>
                </div>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                  <div className="text-center">
                    <p className="text-3xl font-black tabular-nums leading-none">{incomingSeconds}</p>
                    <p className="mt-1 text-[11px] font-black uppercase text-slate-500">sek</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {message && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
              <div className="grid gap-3">
                <Info label="Izazivač" value={incomingInvite.challenger?.username || 'Igrač'} />
                <Info label="Tezina" value={difficultyLabel(incomingInvite.difficulty)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => respond(incomingInvite, false)}
                  disabled={busyId === incomingInvite.id}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <X className="w-5 h-5" /> Odbij
                </button>
                <button
                  onClick={() => respond(incomingInvite, true)}
                  disabled={busyId === incomingInvite.id}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  <Check className="w-5 h-5" /> Prihvati
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {outgoingInvite && outgoingSeconds > 0 && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/40">
            <div className="relative bg-white px-5 py-5 text-slate-950">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400" />
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <Clock3 className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-600">Izazov poslat</p>
                  <h2 className="truncate text-2xl font-black leading-tight">{outgoingInvite.opponent?.username || 'Igrač'}</h2>
                </div>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                  <div className="text-center">
                    <p className="text-3xl font-black tabular-nums leading-none">{outgoingSeconds}</p>
                    <p className="mt-1 text-[11px] font-black uppercase text-slate-500">sek</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3">
                <Info label="Protivnik" value={outgoingInvite.opponent?.username || 'Igrač'} />
                <Info label="Tezina" value={difficultyLabel(outgoingInvite.difficulty)} />
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="font-bold text-violet-900">Ceka se odgovor igrača.</p>
                <p className="mt-1 text-sm font-semibold text-violet-700">Ako ne prihvati za 15 sekundi, izazov se automatski odbija.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
