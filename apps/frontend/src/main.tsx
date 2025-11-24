import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import WelcomePage from './pages/Welcome';
import ThemeTest from './pages/ThemeTest';
import './global/default.css';

//Toggle light/dark theme automatically

if (window.matchMedia('(prefers-color-scheme: dark').matches) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

window.matchMedia('(prefers-color-scheme: dark').addEventListener('change', (e) => {
  if (e.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/theme-test" element={<ThemeTest />} />
      </Routes>
    </Layout>
  </React.StrictMode>
);
