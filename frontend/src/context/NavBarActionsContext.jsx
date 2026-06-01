import { createContext, useContext, useState } from 'react';

const NavBarActionsContext = createContext({ onImport: null, setOnImport: () => {} });

export function NavBarActionsProvider({ children }) {
  const [onImport, setOnImport] = useState(null);
  return (
    <NavBarActionsContext.Provider value={{ onImport, setOnImport }}>
      {children}
    </NavBarActionsContext.Provider>
  );
}

export const useNavBarActions = () => useContext(NavBarActionsContext);
