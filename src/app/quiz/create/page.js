'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CreateQuizPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('quizzes')
      .insert({ title: title.trim(), description: description.trim(), user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      router.push(`/quiz/${data.id}/edit`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a New Quiz</h1>
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <Input
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Q1 Safety Training"
          required
          autoFocus
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this quiz..."
        />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create & Add Questions
          </Button>
        </div>
      </form>
    </div>
  );
}
