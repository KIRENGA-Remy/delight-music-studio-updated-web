import React from 'react';
const ProgressBar = ({ value = 0, label, color = 'purple', size = 'md' }) => {
  const h = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3' }[size];
  const bg = color === 'gold' ? 'bg-gold-gradient' : 'bg-purple-gradient';
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-purple-300 font-display">{label}</span>
          <span className="text-gold-400 font-bold">{value}%</span>
        </div>
      )}
      <div className={`w-full bg-dark-800 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full ${bg} transition-all duration-700`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
};
export default ProgressBar;
