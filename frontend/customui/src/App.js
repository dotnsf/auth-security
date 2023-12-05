import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import './App.css';

import Login from './pages/login';
import Top from './pages/top';

const Router = () => {
  var user = sessionStorage.getItem('user');
  if( user && typeof user == 'string' ){
    user = JSON.parse( user );
  }else{
    user = null;
  }

  useEffect(() => {
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Fragment>
      <Routes>
        {<Route path="/login" element={<Login />} />}
        {<Route path="*" element={<Top />} />}
        {!user && <Route path="*" element={<Navigate replace to="/login" />} />}
      </Routes>
    </React.Fragment>
  );
};

function App() {
  useEffect(() => {
    ( async () => {
    })();
  }, []);

  return (
  <AppContextProvider>
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  </AppContextProvider>
  );
}

export default App;
