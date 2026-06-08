import { createContext, useContext, useState } from 'react';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  // activeRoom: { id, name, uuid } or null
  const [activeRoom, setActiveRoom] = useState(null);

  const enterRoom = (id, name, uuid) => setActiveRoom({ id, name, uuid });
  const leaveRoom = ()          => setActiveRoom(null);

  return (
    <CampaignContext.Provider value={{ activeRoom, enterRoom, leaveRoom }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be inside CampaignProvider');
  return ctx;
}