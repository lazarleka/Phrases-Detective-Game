import { ArrowLeft, Trophy } from 'lucide-react';

export function LeaderboardScreen({ players, currentUsername, onBack }) {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-semibold mb-6"><ArrowLeft className="w-5 h-5" /> Nazad</button>
        <div className="flex items-center gap-3 mb-6"><Trophy className="w-8 h-8 text-amber-500" /><h1 className="text-3xl font-black text-slate-900">Scoreboard</h1></div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[56px_1fr_100px] gap-2 px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <span>Rang</span><span>Igra&#269;</span><span className="text-right">Ukupno</span>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {players.length === 0 ? <p className="p-5 text-slate-500">Jo&#353; nema rezultata.</p> : players.map((player) => {
              const isCurrentPlayer = player.username === currentUsername;

              return (
                <div
                  key={player.username}
                  className={`grid grid-cols-[56px_1fr_100px] gap-2 px-4 py-4 border-t ${isCurrentPlayer ? 'bg-blue-200/80 border-blue-300 border-l-4 border-l-blue-700 shadow-inner' : 'border-slate-100'}`}
                >
                  <span className={`font-black ${isCurrentPlayer ? 'text-blue-950' : 'text-slate-700'}`}>#{player.rank}</span>
                  <span className={`font-bold truncate ${isCurrentPlayer ? 'text-blue-950' : 'text-slate-900'}`}>{player.username}</span>
                  <span className={`text-right font-black ${isCurrentPlayer ? 'text-blue-950' : 'text-blue-700'}`}>{player.totalScore}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
