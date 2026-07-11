import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Clock, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

const QUESTIONS_PER_PLAYER = 10;

// Definisanje strukture za pojedinačno pitanje
interface Question {
  phrase: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface AnswerRecord {
  phrase: string;
  question: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  correct: boolean;
  secondsUsed: number;
}

const FALLBACK_QUESTIONS: Record<'easy' | 'medium' | 'hard', Question[]> = {
  easy: [
    { phrase: 'Break a leg', question: 'Šta ova fraza znači?', options: ['Povrijedi se', 'Srećno', 'Trči brzo', 'Odustani'], correctAnswer: 1 },
    { phrase: 'Piece of cake', question: 'Šta ova fraza znači?', options: ['Nešto veoma lako', 'Sladak poklon', 'Težak zadatak', 'Skup obrok'], correctAnswer: 0 },
    { phrase: 'Spill the beans', question: 'Šta ova fraza znači?', options: ['Prosuti hranu', 'Otkriti tajnu', 'Skuvati rucak', 'Sakriti dokaz'], correctAnswer: 1 },
    { phrase: 'Hit the road', question: 'Šta ova fraza znači?', options: ['Krenuti na put', 'Popraviti ulicu', 'Pasti na testu', 'Voziti prebrzo'], correctAnswer: 0 },
    { phrase: 'Call it a day', question: 'Šta ova fraza znači?', options: ['Nazvati nekoga', 'Završiti posao za danas', 'Planirati dan', 'Kasniti na sastanak'], correctAnswer: 1 },
    { phrase: 'Under the weather', question: 'Šta ova fraza znači?', options: ['Biti bolestan', 'Stajati na kisi', 'Putovati avionom', 'Gledati prognozu'], correctAnswer: 0 },
    { phrase: 'Cost an arm and a leg', question: 'Šta ova fraza znači?', options: ['Biti veoma skupo', 'Biti opasno', 'Biti besplatno', 'Biti kratko'], correctAnswer: 0 },
    { phrase: 'No worries', question: 'Šta ova fraza znači?', options: ['Nema problema', 'Mnogo briga', 'Ne sjećam se', 'Nema vremena'], correctAnswer: 0 },
    { phrase: 'Keep an eye on', question: 'Šta ova fraza znači?', options: ['Paziti na nešto', 'Zatvoriti oči', 'Kupiti naočare', 'Ignorisati problem'], correctAnswer: 0 },
    { phrase: 'Better late than never', question: 'Šta ova fraza znači?', options: ['Bolje ikad nego nikad', 'Nikad ne kasni', 'Kasno je bolje od rano', 'Vrijeme je novac'], correctAnswer: 0 },
  ],
  medium: [
    { phrase: 'Bite the bullet', question: 'Šta ova fraza znači?', options: ['Prihvatiti nešto teško', 'Napraviti grešku', 'Kupiti oruzje', 'Prekinuti raspravu'], correctAnswer: 0 },
    { phrase: 'Cut corners', question: 'Šta ova fraza znači?', options: ['Raditi površno da se uštedi', 'Urediti sobu', 'Pobijediti u trci', 'Promijeniti pravac'], correctAnswer: 0 },
    { phrase: 'On thin ice', question: 'Šta ova fraza znači?', options: ['U rizičnoj situaciji', 'Na zimovanju', 'Veoma smiren', 'Bez dokaza'], correctAnswer: 0 },
    { phrase: 'Go the extra mile', question: 'Šta ova fraza znači?', options: ['Dodatno se potruditi', 'Putovati dalje', 'Kasniti namjerno', 'Zaobići pravila'], correctAnswer: 0 },
    { phrase: 'A blessing in disguise', question: 'Šta ova fraza znači?', options: ['Skrivena sreća u lošem događaju', 'Maskirana osoba', 'Lažno obećanje', 'Brza odluka'], correctAnswer: 0 },
    { phrase: 'The ball is in your court', question: 'Šta ova fraza znači?', options: ['Na tebi je da odlučiš', 'Igraš sport', 'Propustio si šansu', 'Neko te krivi'], correctAnswer: 0 },
    { phrase: 'Burn bridges', question: 'Šta ova fraza znači?', options: ['Uništiti odnose', 'Započeti putovanje', 'Sakriti tragove', 'Raditi noću'], correctAnswer: 0 },
    { phrase: 'Miss the boat', question: 'Šta ova fraza znači?', options: ['Propustiti priliku', 'Putovati brodom', 'Izgubiti kartu', 'Promašiti cilj'], correctAnswer: 0 },
    { phrase: 'Pull yourself together', question: 'Šta ova fraza znači?', options: ['Saberi se', 'Udruži se sa nekim', 'Povuci nešto jako', 'Odmori se'], correctAnswer: 0 },
    { phrase: 'Take it with a grain of salt', question: 'Šta ova fraza znači?', options: ['Ne vjerovati potpuno', 'Dodati začine', 'Prihvatiti savjet odmah', 'Ljutiti se'], correctAnswer: 0 },
  ],
  hard: [
    { phrase: 'Throw in the towel', question: 'Šta ova fraza znači?', options: ['Odustati', 'Početi takmičenje', 'Pomoći nekome', 'Sakriti dokaz'], correctAnswer: 0 },
    { phrase: 'Barking up the wrong tree', question: 'Šta ova fraza znači?', options: ['Kriviti pogrešnu stvar ili osobu', 'Gubiti vrijeme u prirodi', 'Biti previše glasan', 'Tražiti savjet'], correctAnswer: 0 },
    { phrase: 'Burn the midnight oil', question: 'Šta ova fraza znači?', options: ['Raditi do kasno u noć', 'Trošiti novac', 'Spavati duboko', 'Kuvati večeru'], correctAnswer: 0 },
    { phrase: 'Caught between two stools', question: 'Šta ova fraza znači?', options: ['Propasti birajući između dvije opcije', 'Sjedjeti neudobno', 'Biti uhvaćen u laži', 'Izbjeći odluku'], correctAnswer: 0 },
    { phrase: 'A storm in a teacup', question: 'Šta ova fraza znači?', options: ['Velika drama oko male stvari', 'Opasna situacija', 'Loša prognoza', 'Skrivene emocije'], correctAnswer: 0 },
    { phrase: 'Pay through the nose', question: 'Šta ova fraza znači?', options: ['Platiti previše', 'Platiti unaprijed', 'Dugovati novac', 'Pregovarati uspješno'], correctAnswer: 0 },
    { phrase: 'Move the goalposts', question: 'Šta ova fraza znači?', options: ['Promijeniti pravila tokom igre', 'Postići cilj', 'Odloziti utakmicu', 'Pomjeriti namještaj'], correctAnswer: 0 },
    { phrase: 'Have a chip on your shoulder', question: 'Šta ova fraza znači?', options: ['Biti lako uvredljiv', 'Nositi teret', 'Biti veoma ponosan', 'Čuvati tajnu'], correctAnswer: 0 },
    { phrase: 'Open a can of worms', question: 'Šta ova fraza znači?', options: ['Pokrenuti komplikovan problem', 'Naći jednostavno rješenje', 'Otvoriti poklon', 'Započeti šalu'], correctAnswer: 0 },
    { phrase: "Steal someone's thunder", question: 'Šta ova fraza znači?', options: ['Preuzeti tuđu pažnju ili zasluge', 'Uplašiti nekoga', 'Ukrasti nešto vrijedno', 'Govoriti glasno'], correctAnswer: 0 },
  ],
};

function fallbackQuestions(difficulty: 'easy' | 'medium' | 'hard'): Question[] {
  return randomizeCorrectAnswerPositions(FALLBACK_QUESTIONS[difficulty].map((question) => ({
    ...question,
    options: [...question.options],
  })));
}

function placeCorrectAnswerAtPosition(question: Question, targetPosition: number): Question {
  if (!Array.isArray(question.options) || question.options.length < 4) {
    return question;
  }

  const currentCorrectAnswer = Number(question.correctAnswer);
  if (currentCorrectAnswer < 0 || currentCorrectAnswer >= question.options.length) {
    return question;
  }

  const correctOption = question.options[currentCorrectAnswer];
  const wrongOptions = question.options.filter((_, index) => index !== currentCorrectAnswer).slice(0, 3);
  const options = [...wrongOptions];

  options.splice(targetPosition, 0, correctOption);

  return {
    ...question,
    options,
    correctAnswer: targetPosition,
  };
}

function randomizeCorrectAnswerPositions(questions: Question[]): Question[] {
  let previousPosition = -1;

  return questions.map((question) => {
    const availablePositions = [0, 1, 2, 3].filter((position) => position !== previousPosition);
    const targetPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    previousPosition = targetPosition;

    return placeCorrectAnswerAtPosition(question, targetPosition);
  });
}

function playAnswerSound(isCorrect: boolean) {
  if (typeof window === 'undefined') return;

  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return;

  const audioContext = new AudioContextCtor();
  const now = audioContext.currentTime;

  const playTone = (frequency: number, start: number, duration: number, volume: number) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = isCorrect ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  if (isCorrect) {
    playTone(523.25, now, 0.14, 0.06);
    playTone(659.25, now + 0.08, 0.14, 0.07);
    playTone(783.99, now + 0.16, 0.2, 0.08);
    window.setTimeout(() => audioContext.close(), 450);
  } else {
    playTone(220, now, 0.18, 0.08);
    window.setTimeout(() => audioContext.close(), 260);
  }
}

// Definisanje props-a za glavnu GamePlay komponentu
interface GamePlayProps {
  difficulty: 'easy' | 'medium' | 'hard';
  players: 1 | 2;
  onBackToMenu: () => void;
  onGameComplete: (result: {
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    mode: 'SOLO' | 'VERSUS';
    score: number;
    totalQuestions: number;
    durationSeconds: number;
    bonusPoints?: number;
    maxStreak?: number;
    answerHistoryJson?: string;
  }) => Promise<void>;
  onExitGame?: (result: {
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    mode: 'SOLO' | 'VERSUS';
    score: number;
    totalQuestions: number;
    durationSeconds: number;
    bonusPoints?: number;
    maxStreak?: number;
    answerHistoryJson?: string;
  }) => Promise<void>;
  initialQuestions?: Question[];
  hideCompletionScreen?: boolean;
}

export async function fetchQuestionsFromAI(difficulty: 'easy' | 'medium' | 'hard', playerNum: number | null): Promise<Question[]> {
  try {
    return await api.questions(difficulty);
  } catch {
    return fallbackQuestions(difficulty);
  }
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6"/>
        <p className="text-2xl font-bold text-slate-700">{message}</p>
        <p className="text-slate-500 mt-2">Generišemo pitanja za vas...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="text-center max-w-md w-full">
        <p className="text-6xl mb-6">⚠️</p>
        <p className="text-2xl font-bold text-slate-700 mb-3">Greška pri učitavanju</p>
        <p className="text-slate-500 mb-8">Nije moguće generisati pitanja. Proverite internet konekciju.</p>
        <button onClick={onRetry} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all">
          Pokušaj ponovo
        </button>
      </div>
    </div>
  );
}

function ApiErrorScreen({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="text-center max-w-md w-full">
        <p className="text-6xl mb-6">!</p>
        <p className="text-2xl font-bold text-slate-700 mb-3">Greska pri ucitavanju</p>
        <p className="text-slate-500 mb-8">Nije moguce pripremiti pitanja. Pokusaj opet ili se vrati na pocetnu.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onRetry} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all">
            Pokusaj opet
          </button>
          <button onClick={onBack} className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-blue-400 transition-all">
            Nazad
          </button>
        </div>
      </div>
    </div>
  );
}

export function GamePlay({ difficulty, players, onBackToMenu, onGameComplete, onExitGame, initialQuestions, hideCompletionScreen = false }: GamePlayProps) {
  const [player1Questions, setPlayer1Questions] = useState<Question[]>([]);
  const [player2Questions, setPlayer2Questions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [missedQuestions, setMissedQuestions] = useState<Question[]>([]);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [reviewOriginalPlayer1Questions, setReviewOriginalPlayer1Questions] = useState<Question[]>([]);
  const [reviewOriginalPlayer2Questions, setReviewOriginalPlayer2Questions] = useState<Question[]>([]);
  const [reviewOriginalPlayer1Score, setReviewOriginalPlayer1Score] = useState<number>(0);
  const [reviewOriginalPlayer2Score, setReviewOriginalPlayer2Score] = useState<number>(0);
  const [reviewOriginalPlayers, setReviewOriginalPlayers] = useState<1 | 2>(1);
  const [reviewQuestionCount, setReviewQuestionCount] = useState<number>(0);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);
  const gameStartedAt = useRef<number>(Date.now());
  const resultReported = useRef<boolean>(false);
  const exitReported = useRef<boolean>(false);
  const resultMode = hideCompletionScreen || players === 2 ? 'VERSUS' : 'SOLO';
  const reportedScore = hideCompletionScreen ? player1Score + bonusPoints : player1Score;

  const loadQuestions = async () => {
    setLoading(true);
    setError(false);
    setMissedQuestions([]);
    setIsReviewMode(false);
    setReviewOriginalPlayer1Questions([]);
    setReviewOriginalPlayer2Questions([]);
    setReviewOriginalPlayer1Score(0);
    setReviewOriginalPlayer2Score(0);
    setReviewOriginalPlayers(players);
    setReviewQuestionCount(0);
    setShowAnswers(false);
    setCurrentQuestionIndex(0);
    setCurrentPlayer(1);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setGameFinished(false);
    setSaveStatus('idle');
    setBonusPoints(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setAnswerHistory([]);
    resultReported.current = false;
    exitReported.current = false;
    gameStartedAt.current = Date.now();
    try {
      if (initialQuestions?.length) {
        setPlayer1Questions(initialQuestions);
        setPlayer2Questions(players === 2 ? initialQuestions : []);
      } else if (players === 2) {
        const q1 = await fetchQuestionsFromAI(difficulty, null);
        setPlayer1Questions(q1);
        setPlayer2Questions(q1);
      } else {
        const q = await fetchQuestionsFromAI(difficulty, null);
        setPlayer1Questions(q);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!gameFinished || isReviewMode || resultReported.current) return;

    resultReported.current = true;
    setSaveStatus('saving');
    onGameComplete({
      difficulty: difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
      mode: resultMode,
      score: reportedScore,
      totalQuestions: player1Questions.length,
      durationSeconds: Math.max(0, Math.round((Date.now() - gameStartedAt.current) / 1000)),
      bonusPoints,
      maxStreak: bestStreak,
      answerHistoryJson: JSON.stringify(answerHistory),
    })
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('error'));
  }, [gameFinished, isReviewMode, difficulty, resultMode, reportedScore, player1Questions.length, bonusPoints, bestStreak, answerHistory, onGameComplete]);

  const effectivePlayers = isReviewMode ? 1 : players;
  const showSoloBonuses = effectivePlayers === 1 && !isReviewMode;
  const visiblePlayer1Score = isReviewMode ? reviewOriginalPlayer1Score : player1Score;
  const visiblePlayer2Score = isReviewMode ? reviewOriginalPlayer2Score : player2Score;
  const questions = currentPlayer === 1 ? player1Questions : player2Questions;
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (loading || isAnswered || gameFinished || !currentQuestion) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswered, currentQuestionIndex, gameFinished, loading, currentPlayer, currentQuestion]);

  const rememberMissedQuestion = () => {
    if (!currentQuestion || isReviewMode) return;
    setMissedQuestions((previous) => [...previous, currentQuestion]);
  };

  const rememberAnswer = (selectedIndex: number | null, isCorrect: boolean) => {
    if (!currentQuestion || currentPlayer !== 1 || isReviewMode) return;
    setAnswerHistory((previous) => [
      ...previous,
      {
        phrase: currentQuestion.phrase,
        question: currentQuestion.question,
        selectedAnswer: selectedIndex == null ? null : currentQuestion.options[selectedIndex],
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
        correct: isCorrect,
        secondsUsed: 30 - timeLeft,
      },
    ]);
  };

  const startReviewMode = () => {
    if (isReviewMode || missedQuestions.length === 0) return;

    setReviewOriginalPlayer1Questions(player1Questions);
    setReviewOriginalPlayer2Questions(player2Questions);
    setReviewOriginalPlayer1Score(player1Score);
    setReviewOriginalPlayer2Score(player2Score);
    setReviewOriginalPlayers(players);
    setReviewQuestionCount(missedQuestions.length);
    setPlayer1Questions(randomizeCorrectAnswerPositions(missedQuestions));
    setPlayer2Questions([]);
    setCurrentPlayer(1);
    setCurrentQuestionIndex(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setGameFinished(false);
    setIsReviewMode(true);
    setShowAnswers(false);
    setMissedQuestions([]);
    setBonusPoints(0);
    setCurrentStreak(0);
    setBestStreak(0);
  };

  const handleTimeout = () => {
    playAnswerSound(false);
    rememberMissedQuestion();
    rememberAnswer(null, false);
    setCurrentStreak(0);
    setIsAnswered(true);
    setTimeout(() => moveToNextQuestion(), 2000);
  };

  const handleDontKnow = () => {
    if (isAnswered) return;
    playAnswerSound(false);
    rememberMissedQuestion();
    rememberAnswer(null, false);
    setCurrentStreak(0);
    setSelectedAnswer(null);
    setIsAnswered(true);
    setTimeout(() => moveToNextQuestion(), 2000);
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctAnswer;
    playAnswerSound(isCorrect);
    rememberAnswer(index, isCorrect);

    if (isCorrect) {
      if (!isReviewMode) {
        if (currentPlayer === 1) setPlayer1Score((p) => p + 1);
        else setPlayer2Score((p) => p + 1);
      }
      if (showSoloBonuses) {
        const nextStreak = currentStreak + 1;
        const speedBonus = timeLeft >= 20 ? 1 : 0;
        const streakBonus = nextStreak > 0 && nextStreak % 3 === 0 ? 1 : 0;
        setCurrentStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
        setBonusPoints((previous) => previous + speedBonus + streakBonus);
      }
    } else {
      rememberMissedQuestion();
      setCurrentStreak(0);
    }
    setTimeout(() => moveToNextQuestion(), 2000);
  };

  const buildCurrentResult = () => ({
    difficulty: difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
    mode: resultMode as 'SOLO' | 'VERSUS',
    score: reportedScore,
    totalQuestions: player1Questions.length,
    durationSeconds: Math.max(0, Math.round((Date.now() - gameStartedAt.current) / 1000)),
    bonusPoints,
    maxStreak: bestStreak,
    answerHistoryJson: JSON.stringify(answerHistory),
  });

  const handleExit = async () => {
    if (onExitGame && !gameFinished && !isReviewMode && !exitReported.current) {
      exitReported.current = true;
      setSaveStatus('saving');
      try {
        await onExitGame(buildCurrentResult());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }
    onBackToMenu();
  };

  const moveToNextQuestion = () => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    if (effectivePlayers === 2 && currentPlayer === 1 && isLastQuestion) {
      setCurrentPlayer(2);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else if (!isLastQuestion) {
      setCurrentQuestionIndex((p) => p + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      if (isReviewMode) {
        setPlayer1Questions(reviewOriginalPlayer1Questions);
        setPlayer2Questions(reviewOriginalPlayer2Questions);
        setPlayer1Score(reviewOriginalPlayer1Score);
        setPlayer2Score(reviewOriginalPlayer2Score);
        setMissedQuestions([]);
      }
      setGameFinished(true);
    }
  };

  const renderAnswersList = (questionsList: Question[], title: string) => {
    if (!showAnswers) return null;

    return (
      <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-xl border-2 border-slate-200 text-left mt-8">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">{title}</h3>
        <div className="space-y-4">
          {questionsList.map((q, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <p className="text-sm text-slate-500 font-semibold mb-2">Pitanje {index + 1}</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mb-2">"{q.phrase}"</p>
              <p className="text-slate-600 text-sm">Tačan odgovor:</p>
              <p className="text-emerald-600 font-bold text-base sm:text-lg">
                {q.options[q.correctAnswer]}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <LoadingScreen message="Pripremamo pitanja..."/>;
  if (error) return <ApiErrorScreen onRetry={loadQuestions} onBack={onBackToMenu}/>;

  if (gameFinished && hideCompletionScreen) {
    return <LoadingScreen message="Cuvamo Versus rezultat..."/>;
  }

  if (gameFinished) {
    const displayPlayer1Score = isReviewMode ? reviewOriginalPlayer1Score : player1Score;
    const displayPlayer2Score = isReviewMode ? reviewOriginalPlayer2Score : player2Score;
    const winner = displayPlayer1Score > displayPlayer2Score ? 1 : displayPlayer2Score > displayPlayer1Score ? 2 : 0;
    const resultQuestionCount = isReviewMode ? reviewOriginalPlayer1Questions.length : player1Questions.length;
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-4xl w-full text-center py-8">
          <div className="w-20 h-20 sm:w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/30 animate-bounce">
            <Trophy className="w-10 h-10 sm:w-14 h-14 text-white"/>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-6">
            Igra Završena!
          </h2>

          {effectivePlayers === 1 ? (
            <>
              <div className="bg-white rounded-3xl p-6 sm:p-10 mb-6 shadow-xl border-2 border-blue-200">
                <p className="text-slate-600 mb-2 text-base sm:text-lg">Vaš Rezultat</p>
                <p className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {displayPlayer1Score}/{resultQuestionCount}
                </p>
                {showSoloBonuses && (
                  <div className="grid grid-cols-2 gap-3 mt-6 text-left">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-slate-500">Bonus poeni</p>
                      <p className="text-2xl font-black text-blue-700">+{bonusPoints}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-slate-500">Najduži niz</p>
                      <p className="text-2xl font-black text-emerald-700">{bestStreak}</p>
                    </div>
                  </div>
                )}
              </div>

              {renderAnswersList(player1Questions, 'Sve fraze i tačni odgovori')}
              {isReviewMode && reviewOriginalPlayers === 2 && renderAnswersList(player2Questions, 'Igrač 2 - fraze i tačni odgovori')}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className={`bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 ${winner === 1 ? 'border-blue-500 ring-4 ring-blue-200' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white"/>
                      </div>
                      <span className="text-slate-900 font-bold text-lg">Igrač 1</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900">{displayPlayer1Score}</span>
                  </div>
                  {winner === 1 && <p className="text-blue-600 font-bold text-base mt-3 flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> Pobednik!</p>}
                </div>

                <div className={`bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 ${winner === 2 ? 'border-purple-500 ring-4 ring-purple-200' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white"/>
                      </div>
                      <span className="text-slate-900 font-bold text-lg">Igrač 2</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900">{displayPlayer2Score}</span>
                  </div>
                  {winner === 2 && <p className="text-purple-600 font-bold text-base mt-3 flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> Pobednik!</p>}
                </div>
              </div>
              {winner === 0 && <p className="text-slate-600 text-lg sm:text-xl mb-6 font-semibold">Nerešeno! 🙌</p>}

              {renderAnswersList(player1Questions, 'Igrač 1 - fraze i tačni odgovori')}
              {renderAnswersList(player2Questions, 'Igrač 2 - fraze i tačni odgovori')}
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            {showAnswers && (
              <button onClick={onBackToMenu} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all font-bold text-lg">
                Igraj Ponovo
              </button>
            )}
            {!showAnswers && (
              <>
            {missedQuestions.length > 0 && (
              <button onClick={startReviewMode} className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all font-bold text-lg">
                Ponovi pogrešene
              </button>
            )}
            <button onClick={() => setShowAnswers(true)} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all font-bold text-lg">
              Pogledaj sva pitanja i odgovore
            </button>
              </>
            )}
          </div>
          {!isReviewMode && saveStatus !== 'idle' && (
            <p className={`mt-4 text-sm font-semibold ${saveStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
              {saveStatus === 'saving' && 'Čuvanje rezultata...'}
              {saveStatus === 'saved' && 'Rezultat je sačuvan na scoreboardu.'}
              {saveStatus === 'error' && 'Rezultat nije sačuvan. Provjerite da li backend radi.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button onClick={handleExit} className="inline-flex items-center gap-1 sm:vgap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium group text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Izlaz</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="h-10 sm:h-12 flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 rounded-xl shadow-md">
              <Clock className="w-4 h-4 sm:w-5 h-5" />
              <span className="text-base sm:text-lg font-bold">{timeLeft}s</span>
            </div>
            
            {effectivePlayers === 1 ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-10 sm:h-12 flex items-center gap-1.5 bg-white px-3 sm:px-4 rounded-xl shadow-md border-2 border-blue-200">
                  <Trophy className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
                  <span className="text-base sm:text-lg font-bold text-slate-900">{visiblePlayer1Score}</span>
                </div>
                {showSoloBonuses && (
                  <div className="h-10 sm:h-12 flex items-center gap-1.5 bg-white px-3 sm:px-4 rounded-xl shadow-md border-2 border-purple-200 whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-bold text-purple-700">Niz {currentStreak}</span>
                    <span className="text-xs sm:text-sm font-bold text-blue-700">+{bonusPoints}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md border-2 ${currentPlayer === 1 ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-400' : 'bg-white text-slate-900 border-slate-200'}`}>
                  <User className="w-3.5 h-3.5" />
                  <span className="font-bold">I1: {visiblePlayer1Score}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md border-2 ${currentPlayer === 2 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400' : 'bg-white text-slate-900 border-slate-200'}`}>
                  <User className="w-3.5 h-3.5" />
                  <span className="font-bold">I2: {visiblePlayer2Score}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-200 h-2 w-full">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-300 shadow-lg"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 w-full">
        <div className="max-w-4xl w-full flex flex-col items-center">
          
          {effectivePlayers === 2 && (
            <div className="text-center mb-4 sm:mb-6 w-full">
              <p className="inline-block bg-white px-5 py-2.5 rounded-xl shadow-md text-slate-900 font-bold text-base sm:text-lg border-2 border-slate-200">
                🎮 Igrač {currentPlayer} na potezu
              </p>
            </div>
          )}

          {isReviewMode && (
            <div className="text-center mb-4 sm:mb-6 w-full">
              <p className="inline-block bg-emerald-50 px-5 py-2.5 rounded-xl shadow-md text-emerald-700 font-bold text-base sm:text-lg border-2 border-emerald-200">
                Ponavljanje pogrešenih fraza
              </p>
            </div>
          )}

          <div className="text-center mb-4 sm:mb-6">
            <span className="inline-block bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm sm:text-base shadow-sm border-2 border-blue-100">
              Pitanje {currentQuestionIndex + 1} od {questions.length}
            </span>
          </div>

          {/* Phrase Card */}
          <div className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-6 text-center shadow-xl border-2 sm:border-4 border-white">
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">Engleski Idiom</p>
            <p className="text-2xl sm:text-4xl font-black text-white break-words">"{currentQuestion.phrase}"</p>
          </div>

          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 text-center px-2">
            {currentQuestion.question}
          </h3>

          {/* Flexible Options List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswer;
              const isSelected = index === selectedAnswer;
              let buttonClass = 'bg-white border-2 border-slate-200 hover:border-blue-500 hover:shadow-md';
              
              if (isAnswered) {
                if (isCorrect) buttonClass = 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-100';
                else if (isSelected) buttonClass = 'bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-500 shadow-md ring-2 ring-rose-100';
                else buttonClass = 'bg-white border-2 border-slate-200 opacity-40';
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`${buttonClass} ${isAnswered && isCorrect ? 'animate-pulse' : ''} ${isAnswered && isSelected && !isCorrect ? 'animate-bounce' : ''} rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 disabled:cursor-not-allowed w-full min-h-[72px] flex items-center`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 w-full">
                    <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-white text-base sm:text-lg shadow-sm">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-slate-900 font-semibold flex-1 text-base sm:text-lg leading-tight break-words">
                      {option}
                    </span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleDontKnow}
              disabled={isAnswered}
              className="w-full sm:w-auto rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm sm:text-base font-black text-slate-600 shadow-sm transition-all hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ne znam
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
