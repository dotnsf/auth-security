import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import AppID from 'ibmcloud-appid-js';

function App() {
  const appID = React.useMemo( () => {
    return new AppID()
  }, [] );
  const [errState, setErrState] = React.useState( false );
  const [errMessage, setErrMessage] = React.useState( '' );
  const [user, setUser] = React.useState( {} );

  //. ログアウト
  const logoutAction = async () => {
    try{
      setUser( {} );
    }catch( e ){
      console.log( e );
    }
  }

  //. ログイン
  const loginAction = async () => {
    try{
      let tokens;
      try{
        tokens = await appID.silentSignin();
        console.log( { tokens } );
      }catch( e ){
        if( !tokens ){
          tokens = await appID.signin();
          console.log( { tokens } );
        }
      }
      setErrState( false );
      setUser( tokens.idTokenPayload );
    }catch( e ){
      console.log( e );  //. Popup closed
      setErrState( true );
      setErrMessage( e.message );
    }
  }

  useEffect(() => {
    ( async () => {
      try{
        await appID.init({
          clientId: process.env.REACT_APP_APPID_CLIENT_ID,
          discoveryEndpoint: process.env.REACT_APP_APPID_ENDPOINT
        });
      }catch( e ){
        console.log( e );
        setErrState( true );
        setErrMessage( e.message );
      }
    })();
  }, []);

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
}

export default App;
