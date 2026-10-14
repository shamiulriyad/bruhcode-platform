import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ start }) {
  const target = new Date(start).getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (diff === 0) return <span className="text-sm">Started</span>;

  return (
    <span className="text-sm">
      Starts in {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}
