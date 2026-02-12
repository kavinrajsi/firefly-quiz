'use client';

import { useEffect, useState, useRef } from 'react';

export default function Countdown({ from = 3, onComplete }) {
  const [count, setCount] = useState(from);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current?.();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kahoot-purple">
      <div className="text-white text-9xl font-extrabold animate-bounce-in" key={count}>
        {count}
      </div>
    </div>
  );
}
