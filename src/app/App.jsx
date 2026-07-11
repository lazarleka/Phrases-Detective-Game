import "../styles/index.css";
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { LogOut, Medal, UserCircle } from 'lucide-react';
import { api, clearToken, getToken } from './api';
import { AuthScreen } from './components/AuthScreen';
import { ModeSelection } from './components/ModeSelection';
import { DifficultySelection } from './components/DifficultySelection';
import { GamePlay } from './components/GamePlay';
import { ProfileScreen } from './components/ProfileScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { FriendsScreen } from './components/FriendsScreen';
import { ChallengeFriendScreen } from './components/ChallengeFriendScreen';
import { RemoteMatchScreen } from './components/RemoteMatchScreen';
import { MatchInviteSync } from './components/MatchInviteSync';
import { AdminPhraseScreen } from './components/AdminPhraseScreen';
import { resetMobilePushSetup, setupMobilePushNotifications } from './mobilePush';

function LoadingScreen() {
  return <div className="min-h-screen grid place-items-center bg-slate-100 font-bold text-slate-600">Učitavanje...</div>;
}

function Protected({ user, admin = false, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (!admin && user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return children;
}

function DifficultyRoute() {
  const navigate = useNavigate();
  const { players } = useParams();
  const playerCount = Number(players) === 2 ? 2 : 1;

  return (
    <DifficultySelection
      players={playerCount}
      onDifficultySelect={(difficulty) => navigate(playerCount === 2 ? `/challenge/${difficulty}` : `/game/${playerCount}/${difficulty}`)}
      onBack={() => navigate('/')}
    />
  );
}

function GameRoute({ onGameComplete }) {
  const navigate = useNavigate();
  const { players, difficulty } = useParams();
  const playerCount = Number(players) === 2 ? 2 : 1;
  const selectedDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy';

  return (
    <GamePlay
      difficulty={selectedDifficulty}
      players={playerCount}
      onBackToMenu={() => navigate(`/difficulty/${playerCount}`)}
      onGameComplete={onGameComplete}
      onExitGame={playerCount === 1 ? onGameComplete : undefined}
    />
  );
}

function ChallengeRoute() {
  const navigate = useNavigate();
  const { difficulty } = useParams();
  const selectedDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy';
  return <ChallengeFriendScreen difficulty={selectedDifficulty} onBack={() => navigate('/difficulty/2')} onCreated={() => navigate('/friends')} />;
}

function RemoteMatchRoute({ currentUsername, onFinished }) {
  const navigate = useNavigate();
  const { id } = useParams();
  return <RemoteMatchScreen matchId={id} currentUsername={currentUsername} onBack={() => navigate('/friends')} onFinished={onFinished} />;
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));

  const refreshAccountData = useCallback(async () => {
    const [account, rankedPlayers] = await Promise.all([api.me(), api.leaderboard()]);
    setUser(account.user);
    setProgress(account);
    setLeaderboard(rankedPlayers);
    return account;
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    refreshAccountData()
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, [refreshAccountData]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') setupMobilePushNotifications(user);
  }, [user]);

  const handleAuthenticated = async (authenticatedUser) => {
    setUser(authenticatedUser);
    await refreshAccountData();
    navigate(authenticatedUser.role === 'ADMIN' ? '/admin' : '/');
  };

  const handleGameComplete = useCallback(async (result) => {
    const data = await api.saveGame(result);
    setProgress(data);
    setUser(data.user);
    setLeaderboard(await api.leaderboard());
  }, []);

  const logout = () => {
    clearToken();
    resetMobilePushSetup();
    setUser(null);
    setProgress(null);
    setLeaderboard([]);
    navigate('/login');
  };

  if (checkingSession) return <LoadingScreen />;

  return (
    <>
      {user?.role !== 'ADMIN' && <MatchInviteSync user={user} onPlayMatch={(id) => navigate(`/match/${id}`)} onChanged={refreshAccountData} />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace /> : <AuthScreen onAuthenticated={handleAuthenticated} />} />
        <Route path="/admin" element={<Protected user={user} admin><AdminPhraseScreen onLogout={logout} /></Protected>} />
        <Route path="/" element={
          <Protected user={user}>
            <div className="size-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
              <div className="fixed top-3 right-3 z-30 flex items-center gap-1 bg-white border border-slate-200 shadow-md rounded-lg p-1">
                <button onClick={() => navigate('/leaderboard')} title="Scoreboard" className="p-2 text-slate-600 hover:text-amber-600 hover:bg-slate-50 rounded-md"><Medal className="w-5 h-5" /></button>
                <button onClick={() => navigate('/profile')} title="Profil" className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md"><UserCircle className="w-5 h-5" /></button>
                <button onClick={logout} title="Odjava" className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-md"><LogOut className="w-5 h-5" /></button>
              </div>
              <ModeSelection onModeSelect={(players) => navigate(`/difficulty/${players}`)} />
            </div>
          </Protected>
        } />
        <Route path="/difficulty/:players" element={<Protected user={user}><DifficultyRoute /></Protected>} />
        <Route path="/game/:players/:difficulty" element={<Protected user={user}><GameRoute onGameComplete={handleGameComplete} /></Protected>} />
        <Route path="/challenge/:difficulty" element={<Protected user={user}><ChallengeRoute /></Protected>} />
        <Route path="/match/:id" element={<Protected user={user}><RemoteMatchRoute currentUsername={user?.username} onFinished={refreshAccountData} /></Protected>} />
        <Route path="/profile" element={
          <Protected user={user}>
            {progress ? <ProfileScreen progress={progress} onBack={() => navigate('/')} onAchievements={() => navigate('/achievements')} onFriends={() => navigate('/friends')} /> : <LoadingScreen />}
          </Protected>
        } />
        <Route path="/achievements" element={
          <Protected user={user}>
            {progress ? <AchievementsScreen achievements={progress.achievements} onBack={() => navigate('/profile')} /> : <LoadingScreen />}
          </Protected>
        } />
        <Route path="/leaderboard" element={
          <Protected user={user}>
            <LeaderboardScreen players={leaderboard} currentUsername={user?.username} onBack={() => navigate('/')} />
          </Protected>
        } />
        <Route path="/friends" element={<Protected user={user}><FriendsScreen currentUsername={user?.username} onBack={() => navigate('/profile')} onPlayMatch={(id) => navigate(`/match/${id}`)} /></Protected>} />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </>
  );
}
