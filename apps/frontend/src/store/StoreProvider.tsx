import React, { type ReactNode } from 'react';
import { StoreContext } from './context';
import { rootStore } from './RootStore';

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
};
