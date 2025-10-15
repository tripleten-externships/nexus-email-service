import React from 'react';
import ProtectedRoute from '../components/protected-route';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="home-container">
        <h1 className="home-title">Welcome to TripleTen Nexus Email Service</h1>
        <p className="home-subtitle">Your home page</p>
      </div>
    </ProtectedRoute>
  );
}
