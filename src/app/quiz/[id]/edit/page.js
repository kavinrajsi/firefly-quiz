'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import QuestionCard from '@/components/quiz/QuestionCard';
import QuestionEditor from '@/components/quiz/QuestionEditor';
import BulkImport from '@/components/quiz/BulkImport';

export default function EditQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState(null); // null = none, -1 = new
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    setLoading(true);
    const [quizRes, questionsRes] = await Promise.all([
      supabase.from('quizzes').select('*').eq('id', id).single(),
      supabase.from('questions').select('*').eq('quiz_id', id).order('sort_order'),
    ]);
    setQuiz(quizRes.data);
    setQuestions(questionsRes.data || []);
    setLoading(false);
  };

  const saveQuizDetails = async () => {
    if (!quiz) return;
    setSaving(true);
    await supabase.from('quizzes').update({
      title: quiz.title,
      description: quiz.description,
    }).eq('id', id);
    setSaving(false);
  };

  const handleSaveQuestion = async (data) => {
    setSaving(true);
    if (editingIndex === -1) {
      // New question
      const { data: newQ, error } = await supabase
        .from('questions')
        .insert({
          ...data,
          quiz_id: id,
          sort_order: questions.length,
        })
        .select()
        .single();

      if (!error && newQ) {
        setQuestions([...questions, newQ]);
      }
    } else {
      // Edit existing
      const q = questions[editingIndex];
      const { data: updated, error } = await supabase
        .from('questions')
        .update(data)
        .eq('id', q.id)
        .select()
        .single();

      if (!error && updated) {
        const next = [...questions];
        next[editingIndex] = updated;
        setQuestions(next);
      }
    }
    setEditingIndex(null);
    setEditingQuestion(null);
    setSaving(false);
  };

  const handleDeleteQuestion = async (index) => {
    if (!confirm('Delete this question?')) return;
    const q = questions[index];
    await supabase.from('questions').delete().eq('id', q.id);
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleBulkImport = async (importedQuestions) => {
    setSaving(true);
    const startOrder = questions.length;
    const rows = importedQuestions.map((q, i) => ({
      quiz_id: id,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      time_limit: q.time_limit,
      media_url: q.media_url,
      sort_order: startOrder + i,
    }));

    const { data, error: insertError } = await supabase
      .from('questions')
      .insert(rows)
      .select();

    if (insertError) {
      setError('Failed to import some questions. Please try again.');
    } else if (data) {
      setQuestions([...questions, ...data]);
    }
    setShowBulkImport(false);
    setSaving(false);
  };

  const handleMoveQuestion = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const next = [...questions];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    next.forEach((q, i) => (q.sort_order = i));

    // Optimistic update
    setQuestions(next);

    const results = await Promise.all(
      next.map((q, i) =>
        supabase.from('questions').update({ sort_order: i }).eq('id', q.id)
      )
    );

    if (results.some((r) => r.error)) {
      setError('Failed to reorder. Refreshing...');
      loadQuiz();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Quiz not found.</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">×</button>
        </div>
      )}
      {/* Quiz details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Input
              label="Quiz Title"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              onBlur={saveQuizDetails}
            />
            <Input
              label="Description"
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              onBlur={saveQuizDetails}
              placeholder="Optional description..."
            />
          </div>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Back
          </Button>
        </div>
      </div>

      {/* Questions list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowBulkImport(true)}
          >
            Bulk Import
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingIndex(-1);
              setEditingQuestion(null);
            }}
          >
            + Add Question
          </Button>
        </div>
      </div>

      {showBulkImport && (
        <div className="mb-4">
          <BulkImport
            onImport={handleBulkImport}
            onCancel={() => setShowBulkImport(false)}
          />
        </div>
      )}

      {editingIndex !== null && (
        <div className="mb-4">
          <QuestionEditor
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setEditingIndex(null);
              setEditingQuestion(null);
            }}
          />
        </div>
      )}

      {questions.length === 0 && editingIndex === null ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 mb-4">No questions yet</p>
          <Button onClick={() => setEditingIndex(-1)}>Add your first question</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              isFirst={i === 0}
              isLast={i === questions.length - 1}
              onEdit={(idx) => {
                setEditingIndex(idx);
                setEditingQuestion(questions[idx]);
              }}
              onDelete={handleDeleteQuestion}
              onMoveUp={(idx) => handleMoveQuestion(idx, -1)}
              onMoveDown={(idx) => handleMoveQuestion(idx, 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
