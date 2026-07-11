import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Gamepad2, Search, UserPlus, Users, X } from 'lucide-react';
import { api } from '../api';

export function FriendsScreen({ currentUsername, onBack, onPlayMatch }) {
  const [state, setState] = useState({ friends: [], incomingRequests: [], outgoingRequests: [] });
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allUsers;
    return allUsers.filter((person) => person.username.toLowerCase().includes(normalizedQuery));
  }, [allUsers, query]);

  const refresh = async () => {
    const [friends, matchList, users] = await Promise.all([api.friends(), api.matches(), api.searchUsers('')]);
    setState(friends);
    setMatches(matchList);
    setAllUsers(users);
  };

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  const search = (event) => event.preventDefault();

  const action = async (promise) => {
    try {
      setError('');
      await promise;
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const userAction = (person) => {
    const alreadyFriend = state.friends.some((friend) => friend.id === person.id);
    const outgoing = state.outgoingRequests.some((request) => request.user.id === person.id);
    const incoming = state.incomingRequests.some((request) => request.user.id === person.id);
    const actionLabel = alreadyFriend ? 'Prijatelj' : outgoing ? 'Zahtjev poslat' : incoming ? '\u010ceka odgovor' : null;

    return actionLabel || (
      <button onClick={() => action(api.sendFriendRequest(person.username))} className="p-2 text-blue-600" title={'Po\u0161alji zahtjev'}>
        <UserPlus className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-semibold mb-6">
          <ArrowLeft className="w-5 h-5" />
          Nazad na profil
        </button>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-black text-slate-900">Prijatelji</h1>
        </div>
        {error && <p className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{error}</p>}

        <section className="mb-7">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <form onSubmit={search} className="flex gap-2 p-3 border-b border-slate-100 bg-white">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={'Prona\u0111i korisnika po imenu'} className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
              <button className="bg-blue-600 text-white rounded-lg px-4" title={'Pretra\u017ei'}>
                <Search className="w-5 h-5" />
              </button>
            </form>
            <div className="max-h-[365px] overflow-y-auto">
              {visibleUsers.length ? visibleUsers.map((person) => (
                <Row key={person.id} person={person} action={userAction(person)} />
              )) : <Empty text="Nema korisnika za prikaz." />}
            </div>
          </div>
        </section>

        {state.incomingRequests.length > 0 && (
          <Section title="Zahtjevi za prijateljstvo">
            {state.incomingRequests.map((request) => (
              <Row
                key={request.id}
                person={request.user}
                action={<div className="flex gap-1"><button onClick={() => action(api.acceptFriendRequest(request.id))} className="p-2 text-emerald-600" title="Prihvati"><Check className="w-5 h-5" /></button><button onClick={() => action(api.rejectFriendRequest(request.id))} className="p-2 text-red-600" title="Odbij"><X className="w-5 h-5" /></button></div>}
              />
            ))}
          </Section>
        )}

        <Section title={`Moji prijatelji (${state.friends.length})`} scrollAfterFive={state.friends.length > 5} maxHeight="365px">
          {state.friends.length ? state.friends.map((friend) => <Row key={friend.id} person={friend} action={`${friend.totalScore} poena`} />) : <Empty text={'Jo\u0161 nema\u0161 prijatelja. Prona\u0111i nekoga iznad.'} />}
        </Section>

        <Section title="Versus izazovi" scrollAfterFive maxHeight="70vh">
          {matches.length ? matches.map((match) => {
            const incoming = match.opponent.username === currentUsername && match.status === 'PENDING';
            const opponent = match.challenger.username === currentUsername ? match.opponent : match.challenger;
            const myScore = match.challenger.username === currentUsername ? match.challengerScore : match.opponentScore;
            const opponentScore = match.challenger.username === currentUsername ? match.opponentScore : match.challengerScore;
            const resultLabel = getResultLabel(myScore, opponentScore);
            const statusLabel = getMatchStatusLabel(match.status, myScore, opponentScore);

            return (
              <div key={match.id} className="p-4 border-b last:border-0 border-slate-100 flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{opponent.username} - {match.difficulty}</p>
                  <p className="text-sm text-slate-500">
                    {statusLabel}
                    {myScore != null ? ` - Tvoj rezultat ${myScore}` : ''}
                    {resultLabel ? ` - ${resultLabel}` : ''}
                  </p>
                </div>
                {incoming && (
                  <div className="flex gap-1">
                    <button onClick={() => action(api.acceptMatch(match.id))} className="p-2 text-emerald-600"><Check className="w-5 h-5" /></button>
                    <button onClick={() => action(api.rejectMatch(match.id))} className="p-2 text-red-600"><X className="w-5 h-5" /></button>
                  </div>
                )}
                {match.status === 'ACCEPTED' && myScore == null && <button onClick={() => onPlayMatch(match.id)} className="bg-purple-600 text-white px-3 py-2 rounded-lg font-bold">Igraj</button>}
              </div>
            );
          }) : <Empty text="Nema versus izazova." />}
        </Section>
      </div>
    </div>
  );
}

function getResultLabel(myScore, opponentScore) {
  if (myScore == null) return '';
  if (opponentScore == null) return '';
  if (myScore > opponentScore) return 'Pobjeda';
  if (myScore < opponentScore) return 'Poraz';
  return 'Nerije\u0161eno';
}

function getMatchStatusLabel(status, myScore, opponentScore) {
  if (status === 'PENDING') return '\u010ceka prihvatanje';
  if (status === 'REJECTED') return 'Odbijeno';
  if (status === 'COMPLETED') return 'Zavr\u0161eno';
  if (myScore == null) return 'Spremno za igru';
  if (opponentScore == null) return '\u010ceka se protivnik';
  return 'Zavr\u0161eno';
}

function Section({ title, children, scrollAfterFive = false, maxHeight = '430px' }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-black text-slate-900 mb-3">{title}</h2>
      <div
        className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${scrollAfterFive ? 'overflow-y-auto overscroll-contain' : ''}`}
        style={scrollAfterFive ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ person, action }) {
  return <div className="p-4 border-b last:border-0 border-slate-100 flex items-center gap-3"><div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full grid place-items-center font-black">{person.username.slice(0, 1).toUpperCase()}</div><div className="flex-1"><p className="font-bold text-slate-900">{person.username}</p></div><div className="text-sm font-semibold text-slate-500">{action}</div></div>;
}

function Empty({ text }) {
  return <p className="p-5 text-slate-500">{text}</p>;
}
