import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import TopPage from './TopPage';

const Index = () => {
  return (
  <React.Fragment>
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </React.Fragment >
  );
};

export default Index;
