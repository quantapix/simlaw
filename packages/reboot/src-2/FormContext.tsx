import * as React from 'react';

interface ContextType {
  controlId?: any;
}

export const FormContext = React.createContext<ContextType>({});
