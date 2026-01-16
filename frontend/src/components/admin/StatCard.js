import React from 'react';
import { Card } from '../ui/card';

const StatCard = ({ icon: Icon, label, value, color = 'bg-slate-700', testId, isCurrency = false }) => {
  const formattedValue = isCurrency ? `₹${Number(value).toLocaleString()}` : value;
  
  return (
    <Card className="p-6" data-testid={testId} aria-labelledby={`${testId}-label`}>
      <div className="flex items-start justify-between">
        <div>
          <p id={`${testId}-label`} className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
          <p aria-live="polite" role="status" className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{formattedValue}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {Icon && <Icon className="h-6 w-6 text-white" aria-hidden="true" />}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
