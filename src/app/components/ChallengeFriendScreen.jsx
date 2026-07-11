import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Swords } from 'lucide-react';
import { api } from '../api';

export function ChallengeFriendScreen({ difficulty, onBack, onCreated }) {
  const [state, setState] = useState({ friends: [], incomingRequests: [], outgoingRequests: [] });
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState('');

  const pendingOpponentIds = useMemo(() => new Set(
    matches
      .filter((match) => match.status === 'PENDING')
      .flatMap((match) => [match.challenger.id, match.opponent.id])
  ), [matches]);

  const refresh = async () => {
    const [friendsState, matchList] = await Promise.all([
      api.friends(),
      api.matches(),
    ]);
    setState(friendsState);
    setMatches(matchList);
  };

  useEffect(() => {
    refresh().catch((err) => setMessage(err.message));
  }, []);

  const challenge = async (person) => {
    try {
      await api.createMatch(person.username, difficulty);
      setMessage(`Izazov je poslat korisniku ${person.username}.`);
      onCreated();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 sm:py-8">
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-semibold mb-5">
          <ArrowLeft className="w-5 h-5" /> Nazad
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-100">
            <Swords className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Izazovi prijatelja</h1>
        </div>
        <p className="text-slate-500 mb-5 text-sm sm:text-base">
          Te&#382;ina: <strong>{difficulty}</strong>. Izaberi prijatelja za Versus izazov.
        </p>
        {message && <p className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3">{message}</p>}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[min(62vh,520px)] overflow-y-auto">
          {state.friends.length ? state.friends.map((person) => {
            const hasPendingMatch = pendingOpponentIds.has(person.id);

            return (
              <div key={person.id} className="px-3 py-3 sm:px-4 border-b last:border-0 border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full grid place-items-center font-black text-sm shrink-0">
                  {person.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{person.username}</p>
                  <p className="text-sm text-slate-500">{person.totalScore} ukupnih poena</p>
                </div>
                <button
                  onClick={() => challenge(person)}
                  disabled={hasPendingMatch}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-black text-sm sm:text-base shrink-0 ${hasPendingMatch ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'}`}
                >
                  {hasPendingMatch ? 'Na \u010dekanju' : 'Izazovi'}
                </button>
              </div>
            );
          }) : <p className="p-5 text-slate-500">Jo&#353; nema&#353; prijatelja za Versus. Dodaj prijatelje iz profila.</p>}
        </div>
      </div>
    </div>
  );
}
