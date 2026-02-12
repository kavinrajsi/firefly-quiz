'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function JoinForm({ onJoin, loading }) {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!roomCode.trim() || !nickname.trim()) {
      setError('Please fill in both fields');
      return;
    }
    onJoin(roomCode.trim().toUpperCase(), nickname.trim());
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
        label="Your Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Choose a nickname"
        maxLength={20}
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
