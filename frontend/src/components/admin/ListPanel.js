import React from 'react';
import { Card } from '../ui/card';

const ListPanel = ({ title, items = [], renderItem }) => {
  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.items)) return val.items;
    if (Array.isArray(val.results)) return val.results;
    console.warn('ListPanel: unexpected items shape', val);
    return [];
  };

  const list = normalize(items);

  return (
    <Card className="p-6" aria-labelledby={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h3 id={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      <ul role="list" className="space-y-3 max-h-64 overflow-y-auto">
        {list && list.length > 0 ? (
          list.map((it, i) => (
            <li key={i}>
              {renderItem(it, i)}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No items</li>
        )}
      </ul>
    </Card>
  );
};

export default ListPanel;
