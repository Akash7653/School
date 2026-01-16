import React from 'react';

// Small placeholder mini chart / sparkline used in dashboard cards
const MiniChart = ({ height = 48, width = 160 }) => {
  return (
    <div className="h-20 w-64 flex items-center" aria-hidden="true">
      {/* Simple placeholder bars */}
      <div className="flex items-end gap-1 w-full">
        <div className="h-8 w-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-12 w-3 bg-slate-300 dark:bg-slate-600 rounded" />
        <div className="h-6 w-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-10 w-3 bg-slate-300 dark:bg-slate-600 rounded" />
        <div className="h-14 w-3 bg-emerald-500 rounded" />
        <div className="h-7 w-3 bg-slate-300 dark:bg-slate-600 rounded" />
        <div className="h-9 w-3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
};

export default MiniChart;
