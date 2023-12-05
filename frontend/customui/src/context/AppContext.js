import React, {createContext, useContext} from 'react';
import useApp from '../hooks/useApp';

const AppContext = createContext();

const AppContextProvider = ({children}) => {
  const app = useApp();
  return (<AppContext.Provider value={app}>{children}</AppContext.Provider>);
};

const useAppContext = () => useContext(AppContext);

export {AppContextProvider, useAppContext};
