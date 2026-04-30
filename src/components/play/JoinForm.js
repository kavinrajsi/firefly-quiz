'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Employee number format: exactly 4 digits.
function validateEmployeeNumber(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Employee number is required';
  if (!/^\d{4}$/.test(trimmed)) return 'Employee number must be exactly 4 digits';
  return null;
}

export default function JoinForm({ onJoin, loading }) {
  const [roomCode, setRoomCode] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    const employeeError = validateEmployeeNumber(employeeNumber);
    if (employeeError) {
      setError(employeeError);
      return;
    }
    onJoin(roomCode.trim().toUpperCase(), employeeNumber.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        placeholder="Enter 6-digit code"
        maxLength={6}
        className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
        autoFocus
      />
      <Input
        label="Employee Number"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value.replace(/\D/g, ''))}
        placeholder="4-digit employee number"
        maxLength={4}
        inputMode="numeric"
        pattern="\d{4}"
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Join Game
      </Button>
    </form>
  );
}
