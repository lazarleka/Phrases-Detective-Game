import { useEffect, useState } from 'react';
import { ArrowLeft, Award, BarChart3, CheckCircle2, ChevronRight, Trophy, Users, Zap } from 'lucide-react';
import { api } from '../api';

export function ProfileScreen({ progress, onBack, onAchievements, onFriends }) {
  const user = progress.user;
  const [socialNotificationCount, setSocialNotificationCount] = useState(0);
  const stats = progress.profileStats || {};
  const accuracy = user.totalQuestions ? Math.round((user.totalCorrect / user.totalQuestions) * 100) : 0;
  const xp = stats.xp || user.totalScore || 0;
  const xpStart = stats.xpForCurrentLevel || 0;
  const xpNext = stats.xpForNextLevel || 100;
  const xpPercent = Math.min(100, Math.max(0, Math.round(((xp - xpStart) / Math.max(1, xpNext - xpStart)) * 100)));

  useEffect(() => {
    let mounted = true;

    Promise.all([api.friends(), api.matches()])
      .then(([friendsState, matches]) => {
        if (!mounted) return;
        const friendRequests = friendsState.incomingRequests?.length || 0;
        const incomingMatches = matches.filter((match) => match.status === 'PENDING' && match.opponent.username === user.username).length;
        setSocialNotificationCount(friendRequests + incomingMatches);
      })
      .catch(() => {
        if (mounted) setSocialNotificationCount(0);
      });

    return () => {
      mounted = false;
    };
  }, [user.username]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-semibold mb-6">
          <ArrowLeft className="w-5 h-5" /> Nazad
        </button>

        <div className="mb-7">
          <h1 className="text-3xl font-black text-slate-900 mb-1">{user.username}</h1>
          <p className="text-slate-500">{user.email}</p>
        </div>

        <section className="bg-white border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Level</p>
              <p className="text-3xl font-black text-blue-700">{stats.level || 1}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-slate-500">XP</p>
              <p className="text-xl font-black text-slate-900">{xp}/{xpNext}</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${xpPercent}%` }} />
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {[
            ['Broj partija', user.gamesPlayed, BarChart3],
            ['Ukupni poeni', user.totalScore, Trophy],
            ['Tačnost', `${accuracy}%`, CheckCircle2],
          ].map(([label, value, Icon]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-lg p-4">
              <Icon className="w-5 h-5 text-blue-600 mb-3" />
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8">
          <StatCard icon={Zap} label="Versus skor" value={`${stats.versusWins || 0}W / ${stats.versusLosses || 0}L / ${stats.versusDraws || 0}D`} color="text-purple-600" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <button onClick={onAchievements} className="w-full bg-white border border-amber-300 rounded-lg p-5 flex items-center gap-4 text-left hover:border-amber-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-slate-900">Moja dostignu&#263;a</p>
              <p className="text-sm text-slate-600">
                Otklju&#269;ano {progress.achievements.filter((achievement) => achievement.unlocked).length} od {progress.achievements.length}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={onFriends} className="w-full bg-white border border-blue-300 rounded-lg p-5 flex items-center gap-4 text-left hover:border-blue-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-blue-600" /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-black text-slate-900">Prijatelji i izazovi</p>
                {socialNotificationCount > 0 && (
                  <span className="min-w-6 h-6 px-2 rounded-full bg-red-600 text-white text-xs font-black grid place-items-center">
                    {socialNotificationCount > 99 ? '99+' : socialNotificationCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">Prona&#273;i korisnike i odgovori na versus izazove</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-3">Posljednje partije</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[520px] overflow-y-auto">
          {progress.recentGames.length === 0 ? <p className="p-5 text-slate-500">Jo&#353; nema zavr&#353;enih partija.</p> : progress.recentGames.map((game) => <GameRow key={game.id} game={game} />)}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function GameRow({ game }) {
  const history = parseHistory(game.answerHistoryJson);
  return (
    <details className="group border-b last:border-0 border-slate-100">
      <summary className="grid grid-cols-3 gap-2 p-4 cursor-pointer list-none">
        <span className="font-semibold text-slate-800">{game.difficulty}</span>
        <span className="text-slate-500">{game.mode}</span>
        <span className="font-black text-right text-blue-700">
          {game.score}/{game.totalQuestions}
          {game.bonusPoints > 0 ? ` +${game.bonusPoints}` : ''}
        </span>
      </summary>
      {(history.length > 0 || game.maxStreak > 0) && (
        <div className="px-4 pb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-bold text-slate-500 mb-3">Najdu&#382;i niz: {game.maxStreak || 0}</p>
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={`${item.phrase}-${index}`} className="text-sm bg-white border border-slate-100 rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-900">"{item.phrase}"</p>
                    <span className={`font-black ${item.correct ? 'text-emerald-600' : 'text-red-600'}`}>{item.correct ? 'Ta\u010dno' : 'Neta\u010dno'}</span>
                  </div>
                  <p className="text-slate-500 mt-1">Tvoj odgovor: {item.selectedAnswer || 'Isteklo vrijeme'}</p>
                  <p className="text-slate-700 font-semibold">Ta&#269;no: {item.correctAnswer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </details>
  );
}

function parseHistory(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
