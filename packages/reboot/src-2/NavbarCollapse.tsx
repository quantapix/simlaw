import * as React from 'react';
import { useContext } from 'react';
import { Collapse, Props as _Props } from './Collapse';
import { useBootstrapPrefix } from './ThemeProvider';
import { NavbarContext } from './NavbarContext';
import { BsProps } from './helpers';

export interface Props
  extends Omit<_Props, 'children'>,
    React.HTMLAttributes<HTMLDivElement>,
    BsProps {}

export const NavbarCollapse = React.forwardRef<HTMLDivElement, Props>(
  ({ children, bsPrefix, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'navbar-collapse');
    const context = useContext(NavbarContext);
    return (
      <Collapse in={!!(context && context.expanded)} {...ps}>
        <div ref={ref} className={bsPrefix}>
          {children}
        </div>
      </Collapse>
    );
  },
);

NavbarCollapse.displayName = 'NavbarCollapse';
