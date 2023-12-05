import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage';

const Index = () => (
  <React.Fragment>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </React.Fragment >
);

export default Index;
