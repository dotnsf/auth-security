import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../../logo.svg';

const TopPage = () => {
  const navigate = useNavigate();

  var user = sessionStorage.getItem('user');
  if( user && typeof user == 'string' ){
    user = JSON.parse( user );
  }else{
    user = null;
  }

  useEffect(() => {
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginAction = () => {
    navigate( '/login' );
  }

  const logoutAction = () => {
    sessionStorage.setItem('user','');
    navigate( '/' );
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        { ( !user || !user.name ) &&
          <>
          <button onClick={loginAction} id="login">Login</button>
          </>
        }
        { ( user && user.name ) &&
          <>
          <p>{user.name}({user.email})</p>
          <button onClick={logoutAction}>Logout</button>
          </>
        }
      </header>
    </div>
  );
};

export default TopPage;
