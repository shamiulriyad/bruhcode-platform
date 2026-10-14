import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { brainGymAPI } from '../api';

// ─── Helpers ───────────────────────────────────────────────────
function shuffleArray(array) {
  if (!array) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizGameShell({
  gameKey,
  gameTitle = 'Logic Workout',
  gameIcon = '🏋️‍♂️',
  leaderboardPath = '/profile/brain-gym',
  profilePath = '/profile/brain-gym'
}) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Game states: 'SELECTING' | 'PLAYING' | 'SUMMARY'
  const [gameState, setGameState] = useState('SELECTING');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scoring
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [attempts, setAttempts] = useState([]); // Array of { questionId, selectedAnswer, isCorrect, correct }
  const [loading, setLoading] = useState(false);

  const startNewGame = async (selectedDifficulty) => {
    setLoading(true);
    setDifficulty(selectedDifficulty);
    try {
      const { data } = await brainGymAPI.getQuestions(gameKey, selectedDifficulty, 10);
      
      if (!data || data.length === 0) {
        toast.error('No questions available for this difficulty level.');
        setLoading(false);
        return;
      }

      // Prep questions: shuffle options client-side
      const prepped = data.map((q) => ({
        ...q,
        shuffledOptions: shuffleArray(q.options || []),
      }));

      // A tiny artificial delay to showcase the gorgeous shimmer loader
      await new Promise((resolve) => setTimeout(resolve, 800));

      setQuestions(prepped);
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setAttempts([]);
      setGameState('PLAYING');
    } catch (err) {
      toast.error('Failed to load questions. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionAnswered = (selected, isCorrect, correctVal) => {
    const question = questions[currentIndex];

    // Track stats
    const nextAttempts = [
      ...attempts,
      {
        questionId: question.id,
        selectedAnswer: selected,
        isCorrect,
        correct: correctVal,
      },
    ];
    setAttempts(nextAttempts);

    if (isCorrect) {
      const newScore = score + 10 + (streak * 2);
      setScore(newScore);

      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameState('SUMMARY');
    const finalCorrect = attempts.filter((a) => a.isCorrect).length;
    const finalTotal = questions.length;

    // Confetti celebration for high scores
    if (finalCorrect >= Math.ceil(finalTotal * 0.7)) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    try {
      await brainGymAPI.submitScore(gameKey, {
        correct: finalCorrect,
        total: finalTotal,
        bestStreak,
      });
      toast.success('Workout stats successfully saved to your profile!');
    } catch (err) {
      console.warn('Failed to upload game stats to backend', err);
      toast.error('Could not save workout stats. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-slate-200">
      <div className="flex items-center gap-3 justify-center mb-8">
        <span className="text-3xl">{gameIcon}</span>
        <h1 className="text-3xl font-black text-white tracking-tight">
          {gameTitle.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">{gameTitle.split(' ').slice(1).join(' ')}</span>
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <ShimmerLoader key="shimmer" />
        )}

        {!loading && gameState === 'SELECTING' && (
          <DifficultySelector
            key="selecting"
            gameTitle={gameTitle}
            onStart={startNewGame}
            leaderboardPath={leaderboardPath}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {!loading && gameState === 'PLAYING' && questions.length > 0 && (
          <QuestionCard
            key={questions[currentIndex].id}
            question={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            score={score}
            streak={streak}
            onAnswer={handleQuestionAnswered}
            onNext={handleNext}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {!loading && gameState === 'SUMMARY' && (
          <ScoreSummary
            key="summary"
            attempts={attempts}
            totalQuestions={questions.length}
            score={score}
            bestStreak={bestStreak}
            difficulty={difficulty}
            onRestart={() => setGameState('SELECTING')}
            leaderboardPath={leaderboardPath}
            profilePath={profilePath}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-Component: Shimmer Loader ─────────────────────────────
function ShimmerLoader() {
  return (
    <div className="max-w-xl mx-auto p-8 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md space-y-6">
      <div className="h-6 bg-white/5 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse"></div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}

// ─── Sub-Component: Difficulty Selector ─────────────────────────
function DifficultySelector({ gameTitle, onStart, leaderboardPath, prefersReducedMotion }) {
  const levels = ['Easy', 'Medium', 'Hard', 'Mixed'];
  const icons = { Easy: '🟢', Medium: '🟡', Hard: '🔴', Mixed: '🌀' };
  const descs = {
    Easy: 'Introductory level questions with straightforward code structures.',
    Medium: 'Intermediate complexity patterns requiring structured analysis.',
    Hard: 'Advanced edge cases and intricate logic trees to challenge experts.',
    Mixed: 'A balanced workout covering all complexity levels.',
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="p-8 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-2xl text-center max-w-xl mx-auto"
    >
      <h2 className="text-xl font-bold text-white mb-3">Begin {gameTitle}</h2>
      <p className="text-xs text-slate-400 leading-relaxed mb-8">
        Challenge yourself under time constraints! You will analyze code blocks and logic grids under a 15-second timer per question. Complete all questions to save stats to your profile.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
        {levels.map((level) => (
          <motion.button
            key={level}
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            onClick={() => onStart(level)}
            className="p-4 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-slate-900/40 hover:border-sky-500/25 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span>{icons[level]}</span>
              <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                {level}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{descs[level]}</p>
          </motion.button>
        ))}
      </div>

      <div className="mt-2 text-center">
        <Link
          to={leaderboardPath}
          className="text-xs text-slate-500 hover:text-sky-400 transition-colors font-semibold"
        >
          📊 View Leaderboard →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Sub-Component: Question Card ──────────────────────────────
function QuestionCard({ question, index, total, score, streak, onAnswer, onNext, prefersReducedMotion }) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [floats, setFloats] = useState([]); // List of { id, text }
  const timerRef = useRef(null);

  // Reset question state on question change
  useEffect(() => {
    setTimeLeft(15);
    setSelectedOption(null);
    setAnswered(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const selectOption = (opt) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelectedOption(opt);
    setAnswered(true);
    const isCorrect = opt === question.correctAnswer;
    
    if (isCorrect) {
      // Trigger floating +1 effect
      setFloats((prev) => [...prev, { id: Date.now(), text: '+1 🔥' }]);
    }
    
    onAnswer(opt, isCorrect, question.correctAnswer);
  };

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(''); // Timeout represents no choice
    onAnswer('', false, question.correctAnswer);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-2xl relative"
    >
      {/* Top dashboard bar */}
      <div className="flex items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <span className="font-mono text-xs font-semibold text-slate-400">
          Snippet {index + 1} of {total}
        </span>
        <div className="flex gap-6 items-center">
          
          {/* Circular Timer Ring */}
          <TimerRing timeLeft={timeLeft} prefersReducedMotion={prefersReducedMotion} />

          <div className="flex items-center gap-1.5 relative">
            <span className="text-xs">🔥</span>
            <span className="font-mono text-xs font-bold text-amber-400">{streak} streak</span>
            
            {/* Floating Bubble Indicators */}
            <AnimatePresence>
              {floats.map((f) => (
                <motion.span
                  key={f.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 0.8 }}
                  animate={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  onAnimationComplete={() => {
                    setFloats((prev) => prev.filter((item) => item.id !== f.id));
                  }}
                  className="absolute text-xs font-black text-amber-400 pointer-events-none select-none"
                  style={{ top: -14, right: 0 }}
                >
                  {f.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs">🏆</span>
            <span className="font-mono text-xs font-bold text-sky-400">{score} pts</span>
          </div>
        </div>
      </div>

      {/* Code Snippet Box */}
      {question.codeSnippet && (
        <div className="rounded-xl overflow-hidden border border-white/5 mb-6 text-xs max-h-[300px] overflow-y-auto">
          <SyntaxHighlighter
            language={question.language || 'javascript'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, background: '#090d16', padding: '16px' }}
          >
            {question.codeSnippet}
          </SyntaxHighlighter>
        </div>
      )}

      {/* Answer Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {(question.shuffledOptions || []).map((opt) => {
          const isSelected = selectedOption === opt;
          const isCorrect = opt === question.correctAnswer;

          let btnClass = 'border-white/5 bg-slate-950/40 hover:bg-slate-900/40 text-slate-200';
          let scaleEffect = {};
          let shakeEffect = {};

          if (answered) {
            if (isCorrect) {
              btnClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold';
              if (isSelected && !prefersReducedMotion) {
                scaleEffect = { scale: [1, 1.05, 1], transition: { type: "spring", stiffness: 250, damping: 10 } };
              }
            } else if (isSelected) {
              btnClass = 'border-red-500/30 bg-red-500/10 text-red-400 font-bold';
              if (!prefersReducedMotion) {
                shakeEffect = { x: [-6, 6, -5, 5, -2, 2, 0], transition: { duration: 0.3 } };
              }
            } else {
              btnClass = 'opacity-30 border-white/5 bg-slate-950/40 text-slate-400';
            }
          }

          return (
            <motion.button
              key={opt}
              disabled={answered}
              whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              animate={{ ...scaleEffect, ...shakeEffect }}
              onClick={() => selectOption(opt)}
              className={`p-4 rounded-xl border text-sm font-semibold transition-all text-center cursor-pointer ${btnClass}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Post-answer info & advance button */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/5 pt-4 flex flex-col gap-3"
          >
            {question.explanation && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-left">
                <span className="text-xs font-bold text-sky-400 block mb-1">Analysis & Explanation</span>
                <p className="text-xs text-slate-300 leading-relaxed">{question.explanation}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 flex-wrap mt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                ⚠️ Complete all {total} snippets to save score
              </span>
              <button
                onClick={onNext}
                className="px-6 py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                {index < total - 1 ? `Next (${index + 1}/${total}) →` : 'View Results'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-Component: Timer Ring ──────────────────────────────────
function TimerRing({ timeLeft, prefersReducedMotion }) {
  const radius = 18;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 15) * circumference;
  const isUrgent = timeLeft <= 3;

  return (
    <motion.div
      animate={isUrgent && !prefersReducedMotion ? {
        scale: [1, 1.15, 1],
        transition: { repeat: Infinity, duration: 0.6 }
      } : {}}
      className="relative flex items-center justify-center w-10 h-10"
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          className="stroke-slate-950/50 fill-transparent"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          className={`fill-transparent ${isUrgent ? 'stroke-red-400' : 'stroke-sky-400'}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "linear" }}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute font-mono text-[10px] font-bold ${isUrgent ? 'text-red-400' : 'text-slate-300'}`}>
        {timeLeft}
      </span>
    </motion.div>
  );
}

// ─── Sub-Component: Score Summary ──────────────────────────────
function ScoreSummary({
  attempts,
  totalQuestions,
  score,
  bestStreak,
  difficulty,
  onRestart,
  leaderboardPath,
  profilePath,
  prefersReducedMotion
}) {
  const correctCount = useMemo(() => attempts.filter((a) => a.isCorrect).length, [attempts]);
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="p-8 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-2xl text-center max-w-xl mx-auto"
    >
      <div className="mb-6 flex justify-center text-4xl">🏆</div>
      <h2 className="text-2xl font-black text-white mb-2">Round Finished!</h2>
      <p className="text-xs text-slate-400 mb-8">
        Congratulations on completing this workout. Your metrics have been automatically pushed to your profile.
      </p>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <div className="text-2xl font-black text-sky-400 font-mono">{score}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Points</div>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <div className="text-2xl font-black text-emerald-400 font-mono">{accuracy}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</div>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <div className="text-2xl font-black text-amber-400 font-mono">{bestStreak}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Streak</div>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40">
          <div className="text-2xl font-black text-sky-400 font-mono">
            {correctCount}/{totalQuestions}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct Answers</div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={onRestart}
          className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all hover:scale-105 duration-200 cursor-pointer"
        >
          Play Again
        </button>
        <Link
          to={leaderboardPath}
          className="rounded-full px-6 py-3 text-xs font-bold border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 duration-200 cursor-pointer"
        >
          📊 Leaderboard
        </Link>
        <Link
          to={profilePath}
          className="rounded-full px-6 py-3 text-xs font-bold border border-sky-500/25 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-white transition-all hover:scale-105 duration-200 cursor-pointer"
        >
          👤 View Profile
        </Link>
      </div>
    </motion.div>
  );
}
