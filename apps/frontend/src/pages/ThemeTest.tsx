import React from 'react';
import { Button } from '@nexus-email/components/ui/button';
import { Card } from '@nexus-email/components/ui/card';
import { Input } from '@nexus-email/components/ui/input';

export default function ThemeTest() {
  const colors = [
    'background',
    'foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'success',
    'destructive',
    'border',
    'input',
    'ring',
    'popover',
    'popover-foreground',
    'sidebar',
    'sidebar-foreground',
    'sidebar-primary',
    'sidebar-primary-foreground',
    'sidebar-accent',
    'sidebar-accent-foreground',
    'sidebar-border',
    'sidebar-ring',
    'chart-1',
    'chart-2',
    'chart-3',
    'chart-4',
    'chart-5',
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Theme Colors Test</h1>
      <div className="flex flex-wrap gap-4 justify-center">
        {colors.map((color) => (
          <div
            key={color}
            className="p-4 w-36 h-20 rounded-lg text-center"
            style={{
              backgroundColor: `var(--${color})`,
              color: `var(--${color}-foreground)`,
            }}
          >
            {color}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center mt-3">
        <Button>Button</Button>
        <Card className="w-36 h-20 text-center">Card</Card>
        <Input className="placeholder:text-gray-400" placeholder="Input" />
      </div>
    </div>
  );
}
