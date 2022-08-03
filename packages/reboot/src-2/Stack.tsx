import classNames from 'classnames';
import * as React from 'react';
import {
  useBsPrefix,
  useBsBreakpoints,
  useBsMinBreakpoint,
} from './ThemeProvider';
import { BsProps, BsRefComponent } from './helpers';
import { GapValue } from './types';
import createUtilityClassName, {
  ResponsiveUtilityValue,
} from './createUtilityClasses';

export type Direction = 'horizontal' | 'vertical';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  direction?: Direction;
  gap?: ResponsiveUtilityValue<GapValue>;
}

export const Stack: BsRefComponent<'span', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    { as: Component = 'div', bsPrefix, className, direction, gap, ...ps },
    ref,
  ) => {
    bsPrefix = useBsPrefix(
      bsPrefix,
      direction === 'horizontal' ? 'hstack' : 'vstack',
    );
    const breakpoints = useBsBreakpoints();
    const minBreakpoint = useBsMinBreakpoint();
    return (
      <Component
        {...ps}
        ref={ref}
        className={classNames(
          className,
          bsPrefix,
          ...createUtilityClassName({
            gap,
            breakpoints,
            minBreakpoint,
          }),
        )}
      />
    );
  },
);
Stack.displayName = 'Stack';
