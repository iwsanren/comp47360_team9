'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModeContextType {
  mode: boolean;
  toggleMode: () => void;
  setMode: (mode: boolean) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<boolean>(false);

  const toggleMode = () => {
    setMode(prev => !prev);
  };

  return (
    <ModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};
