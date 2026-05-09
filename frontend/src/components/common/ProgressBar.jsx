import React from 'react';

const ProgressBar = ({ value = 0, label, color = 'purple', size = 'md', showValue = true }) => {
  const pct  = Math.min(100, Math.max(0, Number(value) || 0));
  const h    = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }[size];
  const grad = color === 'gold' ? 'bg-gold-gradient' : 'bg-purple-gradient';
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-purple-300 font-medium">{label}</span>
          {showValue && <span className="text-gold-400 font-semibold tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-dark-800 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full ${grad} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
