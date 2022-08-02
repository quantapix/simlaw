import * as React from 'react';
import { useMemo } from 'react';
import { FormContext } from './FormContext';
import { AsProp, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends React.HTMLAttributes<HTMLElement>, AsProp {
  controlId?: string;
}

export const FormGroup: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef(({ controlId, as: Component = 'div', ...ps }, ref) => {
    const context = useMemo(() => ({ controlId }), [controlId]);
    return (
      <FormContext.Provider value={context}>
        <Component {...ps} ref={ref} />
      </FormContext.Provider>
    );
  });

FormGroup.displayName = 'FormGroup';
