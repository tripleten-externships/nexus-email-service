import React, { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import '../global/default.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <React.StrictMode>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>TripleTen Nexus Email Service</h1>
          </header>
          <main className="app-content">{children}</main>
        </div>
      </Router>
    </React.StrictMode>
  );
}
