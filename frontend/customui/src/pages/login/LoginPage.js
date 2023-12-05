import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();

  const axios = Axios.create({
    baseURL: process.env.REACT_APP_APISERVER,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      //const user = JSON.parse(userStr);
      //console.log( {user} );
      //navigate('/');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values) => {
    ( async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      var login_username = document.querySelector( "#login_username" ).value;
      var login_password = document.querySelector( "#login_password" ).value;
      console.log(login_username,login_password);
      const res = await axios.post('/api/login', { username: login_username, password: login_password } );
      console.log({res});
      if( res.data && res.data.status && res.data.user ){
        var user = res.data.user;
        sessionStorage.setItem('user', JSON.stringify(user));
        console.log( {user} );
      }
      navigate('/');
    })();
  };

  return (
    <table>
      <tbody>
      <tr>
        <th>ユーザー名</th>
        <td><input id="login_username" type="text" name="login_username" defaultValue="" /></td>
      </tr>
      <tr>
        <th>パスワード</th>
        <td><input id="login_password" type="password" name="login_password" defaultValue="" /></td>
      </tr>
      <tr>
        <td colSpan="2"><input type="button" value="ログイン" onClick={handleSubmit} /></td>
      </tr>
      </tbody>
    </table>
  );
};

export default LoginPage;
