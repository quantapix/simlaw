import * as React from 'react';
import { useContext } from 'react';
import { Offcanvas, Props as _Props } from './Offcanvas';
import { NavbarContext } from './NavbarContext';

export type Props = Omit<_Props, 'show'>;

export const NavbarOffcanvas = React.forwardRef<HTMLDivElement, Props>(
  (ps, ref) => {
    const context = useContext(NavbarContext);
    return (
      <Offcanvas
        ref={ref}
        show={!!context?.expanded}
        {...ps}
        renderStaticNode
      />
    );
  },
);

NavbarOffcanvas.displayName = 'NavbarOffcanvas';
