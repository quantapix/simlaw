import * as React from 'react';

export interface ContextType {
  onToggle: () => void;
  bsPrefix?: string;
  expanded: boolean;
  expand?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export const NavbarContext = React.createContext<ContextType | null>(null);
NavbarContext.displayName = 'NavbarContext';
