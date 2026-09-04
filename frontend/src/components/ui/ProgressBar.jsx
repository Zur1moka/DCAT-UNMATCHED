import React from 'react';

const ProgressBar = ({ current, max, label, isOvercap = false }) => {
  const percent = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-300 mb-1.5">
        <span>{label}</span>
        <span className="font-mono">{current.toLocaleString()} / {max.toLocaleString()} XP</span>
      </div>
      <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            isOvercap
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400'
              : 'bg-gradient-to-r from-yellow-400 via-gold to-yellow-300'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;