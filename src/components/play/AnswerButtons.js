'use client';

const colors = [
  'bg-kahoot-red hover:bg-red-700',
  'bg-kahoot-blue hover:bg-blue-700',
  'bg-kahoot-yellow hover:bg-yellow-700',
  'bg-kahoot-green hover:bg-green-700',
  'bg-kahoot-purple hover:bg-purple-800',
];

const shapes = ['▲', '◆', '●', '■', '★'];

export default function AnswerButtons({ options, onAnswer, disabled, selected }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => onAnswer(i)}
          disabled={disabled}
          className={`
            answer-btn ${colors[i]} transition-all duration-300
            ${selected === i ? 'ring-4 ring-white scale-105 brightness-110 shadow-lg' : ''}
            ${selected !== null && selected !== i ? 'opacity-30 scale-90' : ''}
          `}
        >
          <span className="mr-2 text-2xl">{shapes[i]}</span>
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}
