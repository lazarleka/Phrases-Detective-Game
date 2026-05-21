import "../styles/index.css";
import { useState } from 'react';
import { ModeSelection } from './components/ModeSelection';
import { DifficultySelection } from './components/DifficultySelection';
import { GamePlay } from './components/GamePlay';

export default function App() {
  const [gameState, setGameState] = useState('mode-selection');
  const [difficulty, setDifficulty] = useState('easy');
  const [players, setPlayers] = useState(1);

  const handleModeSelect = (selectedPlayers) => {
    setPlayers(selectedPlayers);
    setGameState('difficulty-selection');
  };

  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('playing');
  };

  const handleBackToMode = () => {
    setGameState('mode-selection');
  };

  const handleBackToDifficulty = () => {
    setGameState('difficulty-selection');
  };

  return (
    <div className="size-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {gameState === 'mode-selection' && (
        <ModeSelection onModeSelect={handleModeSelect} />
      )}
      {gameState === 'difficulty-selection' && (
        <DifficultySelection
          players={players}
          onDifficultySelect={handleDifficultySelect}
          onBack={handleBackToMode}
        />
      )}
      {gameState === 'playing' && (
        <GamePlay
          difficulty={difficulty}
          players={players}
          onBackToMenu={handleBackToDifficulty}
        />
      )}
    </div>
  );
}
