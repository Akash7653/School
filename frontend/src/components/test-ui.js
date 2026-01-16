import React from 'react';
import { Button } from './button';
import { Label } from './label';

const TestUI = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">UI Components Test</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Button Component</h2>
          <Button>Test Button</Button>
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Label Component</h2>
          <Label>Test Label</Label>
        </div>
      </div>
    </div>
  );
};

export default TestUI;
