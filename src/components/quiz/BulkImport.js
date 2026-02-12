'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

const PLACEHOLDER = `[
  {
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "answer": 1
  }
]`;

export default function BulkImport({ onImport, onCancel }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    try {
      // Strip "export const questions =" or similar preamble
      let cleaned = text.trim();
      const arrayStart = cleaned.indexOf('[');
      if (arrayStart === -1) throw new Error('No JSON array found');
      cleaned = cleaned.slice(arrayStart);
      // Remove trailing semicolons
      cleaned = cleaned.replace(/;\s*$/, '');

      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Expected a non-empty array of questions');
      }

      const questions = parsed.map((q, i) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`Question ${i + 1}: missing question text or options`);
        }
        if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) {
          throw new Error(`Question ${i + 1}: invalid answer index`);
        }
        return {
          question_text: q.question,
          options: q.options,
          correct_option: q.answer,
          time_limit: q.timeLimit || 30,
          media_url: null,
        };
      });

      onImport(questions);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="font-bold text-lg">Bulk Import Questions</h3>
      <p className="text-sm text-gray-500">
        Paste a JSON array of questions. Each item needs <code className="bg-gray-100 px-1 rounded">question</code>, <code className="bg-gray-100 px-1 rounded">options</code> (array), and <code className="bg-gray-100 px-1 rounded">answer</code> (0-based index).
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={14}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm
          focus:outline-none focus:ring-2 focus:ring-kahoot-purple focus:border-transparent"
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleImport} disabled={!text.trim()}>
          Import {text.trim() ? '' : '(paste JSON first)'}
        </Button>
      </div>
    </div>
  );
}
