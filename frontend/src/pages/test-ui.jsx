import React from 'react';
import { TestUI } from '../components/test-ui';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">UI Components Test</h1>
        <TestUI />
      </div>
    </div>
  );
};

export default TestPage;
