import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Trophy, User, XCircle } from 'lucide-react';
import { api } from '../api';

const ROUND_SECONDS = 15;
const FINAL_ROUND_HOLD_MS = 4500;
const MATCH_POLL_MS = 300;

function parseAnswers(json) {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function answerFor(answers, index) {
  return answers.find((answer) => answer.questionIndex === index);
}

function isForfeitCompletion(match, questions) {
  if (!match || match.status !== 'COMPLETED' || !questions?.length) return false;
  const challengerAnswers = parseAnswers(match.challengerAnswersJson);
  const opponentAnswers = parseAnswers(match.opponentAnswersJson);
  return challengerAnswers.length < questions.length || opponentAnswers.length < questions.length;
}

function parseServerDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000)).getTime();
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function syncedRoundStart(match, receivedAt = Date.now()) {
  if (match?.roundStartedAtMs && match?.serverNowMs) {
    return Number(match.roundStartedAtMs) + (receivedAt - Number(match.serverNowMs));
  }
  return parseServerDate(match?.roundStartedAt);
}

function formatTime(ms) {
  if (ms === null || ms === undefined) return '-';
  return `${(ms / 1000).toFixed(2)}s`;
}

function answerText(question, answer) {
  if (!answer || answer.selectedAnswer === null || answer.selectedAnswer === undefined) return 'Nije odgovorio';
  return question.options[answer.selectedAnswer] || 'Nepoznat odgovor';
}

function roundSummary(question, challengerAnswer, opponentAnswer, challengerName, opponentName) {
  if (!challengerAnswer || !opponentAnswer) return { winner: null, text: 'Čeka se drugi igrač.' };

  const challengerCorrect = challengerAnswer.selectedAnswer === question.correctAnswer;
  const opponentCorrect = opponentAnswer.selectedAnswer === question.correctAnswer;

  if (challengerCorrect && opponentCorrect) {
    if (challengerAnswer.elapsedMs < opponentAnswer.elapsedMs) {
      return { winner: challengerName, text: `${challengerName} je bio brži za ${formatTime(opponentAnswer.elapsedMs - challengerAnswer.elapsedMs)}.` };
    }
    if (opponentAnswer.elapsedMs < challengerAnswer.elapsedMs) {
      return { winner: opponentName, text: `${opponentName} je bio brži za ${formatTime(challengerAnswer.elapsedMs - opponentAnswer.elapsedMs)}.` };
    }
    return { winner: null, text: 'Oba igrača su tačna i potpuno izjednačena u vremenu.' };
  }

  if (challengerCorrect) return { winner: challengerName, text: `${challengerName} jedini ima tačan odgovor.` };
  if (opponentCorrect) return { winner: opponentName, text: `${opponentName} jedini ima tačan odgovor.` };

  if (challengerAnswer.selectedAnswer === opponentAnswer.selectedAnswer) {
    return { winner: null, text: 'Oba igrača su izabrala isti netačan odgovor. Nema poena.' };
  }
  return { winner: null, text: 'Oba igrača su pogriješila razlicite odgovore. Nema poena.' };
}

function playerAnswerCard(player, question, answer, accent) {
  const isCorrect = answer?.selectedAnswer === question.correctAnswer;
  return (
    <div className={`bg-white rounded-xl border-2 ${isCorrect ? accent.correctBorder : 'border-rose-200'} p-4 shadow-sm`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-9 h-9 ${accent.bg} rounded-lg flex items-center justify-center shrink-0`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <p className="font-black text-slate-900 truncate">{player.username}</p>
        </div>
        <span className="text-sm font-black text-slate-500">{formatTime(answer?.elapsedMs)}</span>
      </div>
      <div className="flex items-start gap-2">
        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
        <p className="font-bold text-slate-800 leading-snug">{answerText(question, answer)}</p>
      </div>
    </div>
  );
}

function MatchResultScreen({ match, questions, currentUsername, onBack, onRefresh, onRematch }) {
  const challengerAnswers = parseAnswers(match.challengerAnswersJson);
  const opponentAnswers = parseAnswers(match.opponentAnswersJson);
  const challengerScore = match.challengerScore ?? 0;
  const opponentScore = match.opponentScore ?? 0;
  const bothPlayed = match.status === 'COMPLETED';
  const winner = bothPlayed
    ? challengerScore > opponentScore
      ? match.challenger.username
      : opponentScore > challengerScore
        ? match.opponent.username
        : null
    : null;

  const scoreCard = (player, score, accent, isWinner) => (
    <div className={`bg-white border-2 ${isWinner ? accent.border : 'border-slate-200'} rounded-2xl p-5 shadow-xl ${isWinner ? accent.ring : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 ${accent.bg} rounded-xl flex items-center justify-center shrink-0`}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-slate-900 font-black truncate">{player.username}</p>
            {player.username === currentUsername && <p className="text-xs font-bold text-slate-500">Tvoj rezultat</p>}
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900">{score}</p>
      </div>
      {isWinner && (
        <p className={`mt-4 ${accent.text} font-black flex items-center justify-center gap-2`}>
          <Trophy className="w-4 h-4" />
          Pobjednik
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold">
          <ArrowLeft className="w-5 h-5" />
          Nazad na prijatelje
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-3">Versus rezultat</h1>
          {bothPlayed ? (
            winner ? <p className="text-xl font-black text-emerald-600">Pobijedio je {winner}</p> : <p className="text-xl font-black text-slate-700">Neriješeno je</p>
          ) : (
            <p className="text-lg font-bold text-slate-600">Tvoji odgovori su upisani. Čeka se drugi igrač.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {scoreCard(match.challenger, challengerScore, { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', border: 'border-blue-500', ring: 'ring-4 ring-blue-200', text: 'text-blue-600' }, winner === match.challenger.username)}
          {scoreCard(match.opponent, opponentScore, { bg: 'bg-gradient-to-br from-purple-500 to-pink-500', border: 'border-purple-500', ring: 'ring-4 ring-purple-200', text: 'text-purple-600' }, winner === match.opponent.username)}
        </div>

        <div className="text-center mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {!bothPlayed && (
            <button onClick={onRefresh} className="bg-white border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-black shadow-sm hover:border-blue-500 transition-colors">
              Osvježi rezultat
            </button>
          )}
          {bothPlayed && (
            <button onClick={onRematch} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black shadow-sm hover:bg-purple-700 transition-colors">
              Rematch
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-xl border-2 border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-6">Runde i odgovori</h2>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const challengerAnswer = answerFor(challengerAnswers, index);
              const opponentAnswer = answerFor(opponentAnswers, index);
              const summary = roundSummary(question, challengerAnswer, opponentAnswer, match.challenger.username, match.opponent.username);
              return (
                <div key={`${question.phrase}-${index}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                    <div>
                      <p className="text-sm text-slate-500 font-bold mb-1">Pitanje {index + 1}</p>
                      <p className="text-lg font-black text-slate-900">"{question.phrase}"</p>
                      <p className="text-emerald-600 font-black mt-1">Tačno: {question.options[question.correctAnswer]}</p>
                    </div>
                    <p className={`font-black ${summary.winner ? 'text-blue-700' : 'text-slate-600'}`}>
                      {summary.winner ? `Poen: ${summary.winner}` : 'Bez poena'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {playerAnswerCard(match.challenger, question, challengerAnswer, { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', correctBorder: 'border-emerald-300' })}
                    {playerAnswerCard(match.opponent, question, opponentAnswer, { bg: 'bg-gradient-to-br from-purple-500 to-pink-500', correctBorder: 'border-emerald-300' })}
                  </div>
                  <p className="text-sm font-bold text-slate-600">{summary.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VersusLiveGame({ match, questions, currentUsername, onBack, onMatchUpdate, onFinished }) {
  const isChallenger = match.challenger.username === currentUsername;
  const myAnswers = parseAnswers(isChallenger ? match.challengerAnswersJson : match.opponentAnswersJson);
  const opponentAnswers = parseAnswers(isChallenger ? match.opponentAnswersJson : match.challengerAnswersJson);
  const firstMissing = questions.findIndex((_, index) => !answerFor(myAnswers, index));
  const fallbackIndex = firstMissing === -1 ? questions.length - 1 : firstMissing;
  const [currentIndex, setCurrentIndex] = useState(fallbackIndex);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(Boolean(answerFor(myAnswers, currentIndex)));
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [syncedRoundStartedAt, setSyncedRoundStartedAt] = useState(() => syncedRoundStart(match));
  const [roundGateNow, setRoundGateNow] = useState(Date.now());
  const startedAt = useRef(Date.now());

  const currentQuestion = questions[currentIndex];
  const myRoundAnswer = answerFor(myAnswers, currentIndex);
  const opponentRoundAnswer = answerFor(opponentAnswers, currentIndex);
  const bothAnswered = Boolean(myRoundAnswer && opponentRoundAnswer);
  const isLastQuestion = currentIndex >= questions.length - 1;
  const waitingForFinalAnswer = submitted && isLastQuestion && !bothAnswered && match.status !== 'COMPLETED';
  const displayMatch = match;
  const serverRoundStartedAt = syncedRoundStart(displayMatch);
  const currentRoundStartMs = syncedRoundStartedAt ?? serverRoundStartedAt ?? startedAt.current;
  const summary = roundSummary(
    currentQuestion,
    answerFor(parseAnswers(displayMatch.challengerAnswersJson), currentIndex),
    answerFor(parseAnswers(displayMatch.opponentAnswersJson), currentIndex),
    displayMatch.challenger.username,
    displayMatch.opponent.username
  );
  const challengerRoundAnswer = answerFor(parseAnswers(displayMatch.challengerAnswersJson), currentIndex);
  const challengedRoundAnswer = answerFor(parseAnswers(displayMatch.opponentAnswersJson), currentIndex);
  const revealRound = Boolean(challengerRoundAnswer && challengedRoundAnswer);
  const waitingForRoundStart = match.status === 'ACCEPTED' && !revealRound && roundGateNow + 25 < currentRoundStartMs;

  useEffect(() => {
    const roundStart = syncedRoundStartedAt ?? serverRoundStartedAt ?? Date.now();
    startedAt.current = roundStart;
    setSyncedRoundStartedAt(roundStart);
    setRoundGateNow(Date.now());
    setSelectedAnswer(null);
    setSubmitted(Boolean(answerFor(myAnswers, currentIndex)));
    setTimeLeft(ROUND_SECONDS);
  }, [currentIndex]);

  useEffect(() => {
    const delay = currentRoundStartMs - Date.now();
    if (delay <= 0) {
      setRoundGateNow(Date.now());
      return undefined;
    }
    const tick = window.setInterval(() => setRoundGateNow(Date.now()), 100);
    const start = window.setTimeout(() => setRoundGateNow(Date.now()), delay);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(start);
    };
  }, [currentIndex, currentRoundStartMs]);

  useEffect(() => {
    if (!serverRoundStartedAt) return;
    setSyncedRoundStartedAt(serverRoundStartedAt);
  }, [displayMatch.roundStartedAtMs, displayMatch.serverNowMs, displayMatch.roundStartedAt]);

  useEffect(() => {
    if (submitted || waitingForRoundStart) return;
    const timer = window.setInterval(() => {
      const elapsedMs = Math.max(0, Date.now() - currentRoundStartMs);
      const remaining = Math.max(0, ROUND_SECONDS - elapsedMs / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) submitAnswer(null, ROUND_SECONDS * 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [submitted, waitingForRoundStart, currentIndex, currentRoundStartMs]);

  useEffect(() => {
    if (!submitted || bothAnswered || match.status === 'COMPLETED') return;
    const poll = window.setInterval(async () => {
      const updated = await api.match(match.id);
      onMatchUpdate(updated);
      if (updated.status === 'COMPLETED') await onFinished();
    }, MATCH_POLL_MS);
    return () => window.clearInterval(poll);
  }, [submitted, bothAnswered, match.id, match.status]);

  useEffect(() => {
    if (match.status !== 'ACCEPTED') return;
    const poll = window.setInterval(async () => {
      const updated = await api.match(match.id);
      onMatchUpdate(updated);
      if (updated.status === 'COMPLETED') await onFinished();
    }, MATCH_POLL_MS);
    return () => window.clearInterval(poll);
  }, [match.id, match.status, onFinished, onMatchUpdate]);

  useEffect(() => {
    if (!bothAnswered) return;
    let switchTimer;
    const next = window.setTimeout(async () => {
      if (currentIndex >= questions.length - 1) {
        const updated = await api.match(match.id);
        onMatchUpdate(updated);
        await onFinished();
      } else {
        const updated = await api.match(match.id);
        const updatedRoundStartedAt = syncedRoundStart(updated);
        if (updatedRoundStartedAt) {
          setSyncedRoundStartedAt(updatedRoundStartedAt);
        }
        onMatchUpdate(updated);
        const switchDelay = updatedRoundStartedAt ? Math.max(0, updatedRoundStartedAt - Date.now()) : 2600;
        switchTimer = window.setTimeout(() => {
          setCurrentIndex((previous) => previous + 1);
        }, switchDelay);
      }
    }, currentIndex >= questions.length - 1 ? 2600 : 0);
    return () => {
      window.clearTimeout(next);
      window.clearTimeout(switchTimer);
    };
  }, [bothAnswered, currentIndex, questions.length, match.id]);

  const submitAnswer = async (answerIndex, forcedElapsedMs = null) => {
    if (submitted || sending || waitingForRoundStart) return;
    setSending(true);
    setSelectedAnswer(answerIndex);
    setSubmitted(true);
    const elapsedMs = forcedElapsedMs ?? Math.min(ROUND_SECONDS * 1000, Math.max(0, Date.now() - currentRoundStartMs));
    try {
      const updated = await api.submitMatchAnswer(match.id, {
        questionIndex: currentIndex,
        selectedAnswer: answerIndex,
        elapsedMs: Math.round(elapsedMs),
      });
      onMatchUpdate(updated);
      if (updated.status === 'COMPLETED') await onFinished();
    } finally {
      setSending(false);
    }
  };

  const forfeitAndExit = async () => {
    if (leaving || match.status !== 'ACCEPTED') return;
    setLeaving(true);
    try {
      const updated = await api.forfeitMatch(match.id);
      onMatchUpdate(updated);
      await onFinished();
    } finally {
      onBack();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white/85 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <button onClick={forfeitAndExit} disabled={leaving} className="inline-flex items-center justify-center sm:justify-start gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold text-sm sm:text-base min-h-10 disabled:opacity-60">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            {leaving ? 'Predaja...' : 'Izlaz'}
          </button>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 rounded-xl shadow-md min-w-0">
              {submitted ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
              <span className="text-sm sm:text-lg font-black truncate">{submitted ? 'Čekanje' : `${timeLeft.toFixed(1)}s`}</span>
            </div>
            <div className="h-11 flex items-center justify-center gap-2 bg-white px-3 sm:px-4 rounded-xl shadow-md border-2 border-blue-100 min-w-0">
              <Trophy className="w-5 h-5 text-blue-600" />
              <span className="text-sm sm:text-base font-black text-slate-900">{match.challengerScore ?? 0} : {match.opponentScore ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-200 h-2 w-full">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {waitingForRoundStart ? (
          <div className="max-w-4xl w-full">
            <div className="rounded-3xl border-2 border-white bg-white/90 p-8 text-center shadow-xl">
              <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">Sinhronizacija runde</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Runda počinje...</h3>
              <p className="mt-3 text-lg font-black text-slate-600">
                {Math.max(0, (currentRoundStartMs - roundGateNow) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        ) : (
        <div className="max-w-4xl w-full">
          <div className="text-center mb-4">
            <span className="inline-block bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm sm:text-base shadow-sm border-2 border-blue-100">
              Pitanje {currentIndex + 1} od {questions.length}
            </span>
          </div>

          <div className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-6 text-center shadow-xl border-2 sm:border-4 border-white">
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">Engleski idiom</p>
            <p className="text-2xl sm:text-4xl font-black text-white break-words">"{currentQuestion.phrase}"</p>
          </div>

          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 text-center px-2">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswer;
              const challengerSelection = revealRound
                ? challengerRoundAnswer?.selectedAnswer
                : isChallenger ? (challengerRoundAnswer?.selectedAnswer ?? selectedAnswer) : undefined;
              const challengedSelection = revealRound
                ? challengedRoundAnswer?.selectedAnswer
                : !isChallenger ? (challengedRoundAnswer?.selectedAnswer ?? selectedAnswer) : undefined;
              const chosenByChallenger = challengerSelection === index;
              const chosenByChallenged = challengedSelection === index;
              const sharedChoice = chosenByChallenger && chosenByChallenged;
              const bothCorrect = revealRound && sharedChoice && isCorrect;
              const challengerFaster = bothCorrect && challengerRoundAnswer.elapsedMs < challengedRoundAnswer.elapsedMs;
              const challengedFaster = bothCorrect && challengedRoundAnswer.elapsedMs < challengerRoundAnswer.elapsedMs;
              const hasPlayerColor = chosenByChallenger || chosenByChallenged;
              const showChallengerTime = revealRound && chosenByChallenger;
              const showChallengedTime = revealRound && chosenByChallenged;
              let buttonClass = 'bg-white border-2 border-slate-200 hover:border-blue-500 hover:shadow-md';
              if (submitted) buttonClass = 'bg-white border-2 border-slate-200 shadow-sm';
              if (revealRound && isCorrect) buttonClass = 'bg-white border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-200';
              return (
                <button
                  key={`${currentIndex}-${option}-${revealRound ? 'revealed' : 'hidden'}`}
                  onClick={() => submitAnswer(index)}
                  disabled={submitted || sending}
                  className={`${buttonClass} relative isolate overflow-hidden rounded-xl sm:rounded-2xl px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8 text-left transition-all duration-200 disabled:cursor-not-allowed w-full h-[84px] sm:h-[92px] flex items-center`}
                >
                  {hasPlayerColor && (
                    <div className="absolute inset-0 z-0 flex" aria-hidden="true">
                      {sharedChoice ? (
                        <>
                          <div
                            className={`h-full shrink-0 bg-blue-600 ${challengerFaster ? 'versus-fill-winner' : challengedFaster ? 'versus-fill-loser' : ''}`}
                            style={{ width: '50%' }}
                          />
                          <div
                            className={`h-full shrink-0 bg-red-600 ${challengedFaster ? 'versus-fill-winner' : challengerFaster ? 'versus-fill-loser' : ''}`}
                            style={{ width: '50%' }}
                          />
                        </>
                      ) : chosenByChallenger ? (
                        <div className="h-full w-full bg-blue-600" />
                      ) : (
                        <div className="h-full w-full bg-red-600" />
                      )}
                    </div>
                  )}
                  {showChallengerTime && (
                    <span className="absolute left-4 top-2 z-20 min-w-[42px] rounded-[5px] border border-blue-900/35 bg-blue-500 px-2 py-0.5 text-center text-[10px] font-black leading-none text-white shadow-sm">
                      {formatTime(challengerRoundAnswer.elapsedMs)}
                    </span>
                  )}
                  {showChallengedTime && (
                    <span className={`${showChallengerTime ? 'right-4' : 'left-4'} absolute top-2 z-20 min-w-[42px] rounded-[5px] border border-red-900/35 bg-red-400 px-2 py-0.5 text-center text-[10px] font-black leading-none text-white shadow-sm`}>
                      {formatTime(challengedRoundAnswer.elapsedMs)}
                    </span>
                  )}
                  <div className="relative z-10 flex items-center gap-3 sm:gap-4 w-full">
                    <span className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-sm ${hasPlayerColor ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`${hasPlayerColor ? 'text-white drop-shadow-sm' : 'text-slate-900'} block font-semibold text-base sm:text-lg leading-tight break-words`}>{option}</span>
                    </span>
                    {revealRound && isCorrect && (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => submitAnswer(null)}
              disabled={submitted || sending}
              className="w-full sm:w-auto rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm sm:text-base font-black text-slate-600 shadow-sm transition-all hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ne znam
            </button>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

export function RemoteMatchScreen({ matchId, currentUsername, onBack, onFinished }) {
  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [finishingRound, setFinishingRound] = useState(false);

  const loadMatch = async () => {
    try {
      const loaded = await api.match(matchId);
      if (loaded.status !== 'ACCEPTED' && loaded.status !== 'COMPLETED') {
        throw new Error('Ovaj meč još nije prihvaćen.');
      }
      setMatch(loaded);
      setQuestions(JSON.parse(loaded.questionsJson));
      return loaded;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  useEffect(() => {
    if (!finishingRound) return;
    const timer = window.setTimeout(async () => {
      setFinishingRound(false);
      await onFinished();
    }, FINAL_ROUND_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [finishingRound, onFinished]);

  const updateLiveMatch = (updated) => {
    if (updated.status === 'COMPLETED' && match?.status === 'ACCEPTED' && !isForfeitCompletion(updated, questions)) {
      setFinishingRound(true);
    }
    setMatch(updated);
  };

  const showResult = match?.status === 'COMPLETED' && !finishingRound;

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 p-5">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button onClick={onBack} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Nazad</button>
        </div>
      </div>
    );
  }

  if (!match || !questions) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 font-bold text-slate-600">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          Pripremamo zajednička pitanja...
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <MatchResultScreen
        match={match}
        questions={questions}
        currentUsername={currentUsername}
        onBack={onBack}
        onRefresh={async () => {
          const updated = await loadMatch();
          if (updated) await onFinished();
        }}
        onRematch={async () => {
          const opponent = match.challenger.username === currentUsername ? match.opponent : match.challenger;
          await api.createMatch(opponent.username, match.difficulty);
          await onFinished();
          onBack();
        }}
      />
    );
  }

  return (
    <VersusLiveGame
      match={match}
      questions={questions}
      currentUsername={currentUsername}
      onBack={onBack}
      onMatchUpdate={updateLiveMatch}
      onFinished={onFinished}
    />
  );
}
