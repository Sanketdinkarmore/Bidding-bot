import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'bg-blue-600' }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
};

export default ProgressBar; 