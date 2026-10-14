import React from 'react';
import QuizGameShell from '../components/QuizGameShell';

export default function DebugGame() {
  return (
    <QuizGameShell
      gameKey="debug_the_code"
      gameTitle="Debug the Code"
      gameIcon="🐛"
      leaderboardPath="/games/debug/leaderboard"
      profilePath="/profile/brain-gym"
    />
  );
}
