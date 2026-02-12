'use client';

import { useEffect, useState } from 'react';

export default function Timer({ duration, onComplete, size = 120 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration) * circumference;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const color = timeLeft > duration * 0.5
    ? '#26890c'
    : timeLeft > duration * 0.25
      ? '#d89e00'
      : '#e21b3c';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-100"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {Math.ceil(timeLeft)}
      </span>
    </div>
  );
}
