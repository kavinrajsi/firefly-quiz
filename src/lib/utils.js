/**
 * Generate a 6-character alphanumeric room code (uppercase, no ambiguous chars).
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Export participant answers to CSV format.
 */
export function exportToCSV(participants, answers, questions) {
  const headers = ['Rank', 'Nickname', 'Total Score'];
  questions.forEach((q, i) => {
    headers.push(`Q${i + 1} Answer`, `Q${i + 1} Correct`, `Q${i + 1} Points`, `Q${i + 1} Time (s)`);
  });

  const sorted = [...participants].sort((a, b) => b.score - a.score);

  const rows = sorted.map((p, rank) => {
    const row = [rank + 1, p.nickname, p.score];
    questions.forEach((q) => {
      const answer = answers.find(
        (a) => a.participant_id === p.id && a.question_id === q.id
      );
      if (answer) {
        row.push(
          q.options[answer.selected_option] || answer.selected_option,
          answer.is_correct ? 'Yes' : 'No',
          answer.points_earned,
          answer.time_taken.toFixed(1)
        );
      } else {
        row.push('No answer', 'No', 0, '-');
      }
    });
    return row;
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Download a string as a file.
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format a date to a readable string.
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
