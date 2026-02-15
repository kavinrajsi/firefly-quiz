'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MediaUpload from './MediaUpload';

const optionColors = ['border-kahoot-red', 'border-kahoot-blue', 'border-kahoot-yellow', 'border-kahoot-green'];
const optionLabels = ['Red', 'Blue', 'Yellow', 'Green'];

export default function QuestionEditor({ question, onSave, onCancel }) {
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [timeLimit, setTimeLimit] = useState(20);
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (question) {
      setText(question.question_text || '');
      setOptions(question.options || ['', '', '', '']);
      setCorrectOption(question.correct_option ?? 0);
      setTimeLimit(question.time_limit || 20);
      setMediaUrl(question.media_url || '');
    }
  }, [question]);

  const handleSave = () => {
    if (!text.trim()) return;
    if (options.some((o) => !o.trim())) return;

    onSave({
      question_text: text.trim(),
      options: options.map((o) => o.trim()),
      correct_option: correctOption,
      time_limit: timeLimit,
      media_url: mediaUrl || null,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="font-bold text-lg">
        {question ? 'Edit Question' : 'Add Question'}
      </h3>

      <Input
        label="Question text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your question here..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correctOption === i}
              onChange={() => setCorrectOption(i)}
              className="w-4 h-4 text-kahoot-purple"
            />
            <div className={`flex-1 border-l-4 ${optionColors[i]} pl-3`}>
              <Input
                placeholder={`${optionLabels[i]} answer`}
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Select the radio button next to the correct answer.</p>

      <div className="flex items-center gap-4">
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time limit</label>
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kahoot-purple"
          >
            {[20, 30, 45, 60].map((t) => (
              <option key={t} value={t}>{t} seconds</option>
            ))}
          </select>
        </div>
      </div>

      <MediaUpload mediaUrl={mediaUrl} onUpload={setMediaUrl} />

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Question</Button>
      </div>
    </div>
  );
}
