'use client';

import { useEffect, useState } from 'react';

export default function Countdown({ from = 3, onComplete }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kahoot-purple">
      <div className="text-white text-9xl font-extrabold animate-bounce-in" key={count}>
        {count}
      </div>
    </div>
  );
}
