import React from 'react';
import { Card } from '../ui/card';

const OverviewPanel = ({ title, children }) => {
  const id = `overview-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <Card className="p-6 mb-6" role="region" aria-labelledby={id}>
      <h3 id={id} className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </Card>
  );
};

export default OverviewPanel;
