import React from 'react';
import ProgressBar from './ui/progress-bar';

interface DashboardCardProps {
  title: string;
  amount: string;
  Icon: React.ElementType;
  progress?: number;
  progressColor?: string;
  showProgress?: boolean;
  cardBgClass?: string;
  iconBgClass?: string;
  iconClass?: string;
  textColor?: string;
  amountColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  amount, 
  Icon,
  progress = 0, 
  progressColor = 'bg-gray-900',
  showProgress = true,
  cardBgClass = 'bg-white',
  iconBgClass = 'bg-gray-200',
  iconClass = 'text-gray-600',
  textColor = 'text-gray-600',
  amountColor = 'text-gray-900',
}) => {
  return (
    <div className={`flex flex-col justify-between rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 ${cardBgClass}`}>
      <div className="flex items-start justify-between">
        <div className={`flex-shrink-0 rounded-full p-3 ${iconBgClass}`}>
          <Icon className={`h-7 w-7 ${iconClass}`} />
        </div>
        <div className="text-right">
          <h3 className={`text-base font-semibold ${textColor}`}>{title}</h3>
          <p className={`mt-1 text-3xl font-bold ${amountColor}`}>{amount}</p>
        </div>
      </div>
      {showProgress && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${textColor}`}>Completed</span>
            <span className={`text-sm font-bold ${amountColor}`}>{`${Math.round(progress)}%`}</span>
          </div>
          <ProgressBar progress={progress} color={progressColor} />
        </div>
      )}
    </div>
  );
};

export default DashboardCard; 