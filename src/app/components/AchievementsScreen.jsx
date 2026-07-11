import { useState } from 'react';
import { ArrowLeft, Award, CalendarDays, Crown, Search, Target, Trophy } from 'lucide-react';

const icons = { search: Search, badge: Award, crown: Crown, target: Target, trophy: Trophy, calendar: CalendarDays };

export function AchievementsScreen({ achievements, onBack }) {
  const [filter, setFilter] = useState('all');
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const visible = achievements.filter((achievement) => filter === 'all' || (filter === 'unlocked' ? achievement.unlocked : !achievement.unlocked));

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-semibold mb-6">
          <ArrowLeft className="w-5 h-5" /> Nazad na profil
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Moja dostignuća</h1>
            <p className="text-slate-500 mt-1">Otključano {unlocked} od {achievements.length}</p>
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-lg">
            {[['all', 'Sva'], ['unlocked', 'Otključana'], ['locked', 'Zaključana']].map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-md text-sm font-bold ${filter === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-7">
          <div className="h-full bg-amber-500" style={{ width: `${achievements.length ? (unlocked / achievements.length) * 100 : 0}%` }} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((achievement) => {
            const Icon = icons[achievement.icon] || Award;
            return (
              <div key={achievement.id} className={`border rounded-lg p-5 ${achievement.unlocked ? 'bg-white border-amber-300' : 'bg-slate-200/60 border-slate-300 opacity-70'}`}>
                <Icon className={`w-7 h-7 mb-4 ${achievement.unlocked ? 'text-amber-500' : 'text-slate-500'}`} />
                <p className="font-black text-lg text-slate-900">{achievement.name}</p>
                <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
                <p className={`text-xs font-bold mt-4 ${achievement.unlocked ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {achievement.unlocked ? 'Otključano' : 'Zaključano'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
