'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import JoinForm from '@/components/play/JoinForm';

export default function JoinPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (roomCode, nickname) => {
    setLoading(true);
    setError('');

    try {
      // Find session by room code
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('id, status')
        .eq('room_code', roomCode)
        .single();

      if (sessionError || !session) {
        setError('Room not found. Check the code and try again.');
        setLoading(false);
        return;
      }

      if (session.status === 'finished') {
        setError('This game has already ended.');
        setLoading(false);
        return;
      }

      // Add participant (enforce max 20 chars)
      const safeName = nickname.slice(0, 20);
      const { data: participant, error: joinError } = await supabase
        .from('participants')
        .insert({ session_id: session.id, nickname: safeName })
        .select()
        .single();

      if (joinError) {
        setError('Failed to join. Try again.');
        setLoading(false);
        return;
      }

      // Store participant info in sessionStorage for the game page
      sessionStorage.setItem(
        `participant-${session.id}`,
        JSON.stringify({ id: participant.id, nickname, roomCode })
      );

      router.push(`/play/${session.id}`);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-kahoot-purple mb-2">Join Game</h1>
          <p className="text-gray-500">Enter the room code shown on the host&apos;s screen</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <JoinForm onJoin={handleJoin} loading={loading} />
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
