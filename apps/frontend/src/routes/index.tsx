import LoginForm from '../pages/Login';
import HomePage from '../pages/Home';
import WelcomePage from '../pages/Welcome';
import { Route, Routes } from 'react-router-dom';
import React from 'react';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  );
};

export default AppRoutes;
