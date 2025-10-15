import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import WelcomePage from './pages/Welcome';
import './global/default.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
      </Routes>
    </Layout>
  </React.StrictMode>
);
