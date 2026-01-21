import React from 'react';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '../components/protected-route';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="home-container">
        <h1 className="home-title">Welcome to TripleTen Nexus Email Service</h1>
        <p className="home-subtitle">Your home page</p>
        <Button
          className="mt-6 bg-red-500"
          variant="default"
          onClick={() => {
            alert('Button clicked');
          }}
        >
          HELLO WORLD
        </Button>
      </div>
    </ProtectedRoute>
  );
}
