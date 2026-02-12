'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function MediaUpload({ mediaUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const supabase = createClient();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('quiz-media')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('quiz-media')
        .getPublicUrl(path);

      onUpload(data.publicUrl);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Media (optional)
      </label>
      {mediaUrl ? (
        <div className="relative inline-block">
          <img
            src={mediaUrl}
            alt="Question media"
            className="h-32 rounded-lg object-cover"
          />
          <button
            onClick={() => onUpload('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload Image/Video
          </Button>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
