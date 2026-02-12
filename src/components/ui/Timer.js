'use client';

import { useEffect, useState, useRef } from 'react';

export default function Timer({ duration, onComplete, size = 120 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onCompleteRef = useRef(onComplete);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration) * circumference;

  // Keep callback ref fresh without restarting interval
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Single stable interval — no onComplete or timeLeft in deps
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          clearInterval(timer);
          // Use setTimeout(0) to avoid calling setState during render
          setTimeout(() => onCompleteRef.current?.(), 0);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [duration]);

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
