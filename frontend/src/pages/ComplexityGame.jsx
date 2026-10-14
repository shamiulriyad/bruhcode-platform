import React from 'react';
import QuizGameShell from '../components/QuizGameShell';

export default function ComplexityGame() {
  return (
    <QuizGameShell
      gameKey="complexity_guess"
      gameTitle="Complexity Quiz"
      gameIcon="🏋️‍♂️"
      leaderboardPath="/games/complexity/leaderboard"
      profilePath="/profile/brain-gym"
    />
  );
}
