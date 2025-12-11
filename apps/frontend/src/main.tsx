import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './components/Layout';
import './global/default.css';
import AppRoutes from './routes';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout>
      <AppRoutes />
    </Layout>
  </React.StrictMode>
);
