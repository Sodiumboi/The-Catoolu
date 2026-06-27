import { createContext, useContext, useState } from 'react';

const NavBarActionsContext = createContext({
  onImport: null, setOnImport: () => {},
  onLeaveRoom: null, setOnLeaveRoom: () => {},
});

export function NavBarActionsProvider({ children }) {
  const [onImport,    setOnImport]    = useState(null);
  const [onLeaveRoom, setOnLeaveRoom] = useState(null);
  return (
    <NavBarActionsContext.Provider value={{ onImport, setOnImport, onLeaveRoom, setOnLeaveRoom }}>
      {children}
    </NavBarActionsContext.Provider>
  );
}

export const useNavBarActions = () => useContext(NavBarActionsContext);
