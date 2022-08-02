import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useDropdownToggle } from '@restart/ui/DropdownToggle';
import DropdownContext from '@restart/ui/DropdownContext';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import { Button, Props as _Props, CommonButtonProps } from './Button';
import { Context as InputGroupContext } from './InputGroup';
import { useBootstrapPrefix } from './ThemeProvider';
import useWrappedRefWithWarning from './useWrappedRefWithWarning';
import { BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends Omit<_Props, 'as'> {
  as?: React.ElementType;
  split?: boolean;
  childBsPrefix?: string;
}

type DropdownToggleComponent = BsPrefixRefForwardingComponent<'button', Props>;

export type PropsFromToggle = Partial<
  Pick<React.ComponentPropsWithRef<DropdownToggleComponent>, CommonButtonProps>
>;

export const DropdownToggle: DropdownToggleComponent = React.forwardRef(
  (
    {
      bsPrefix,
      split,
      className,
      childBsPrefix,
      as: Component = Button,
      ...ps
    }: Props,
    ref,
  ) => {
    const prefix = useBootstrapPrefix(bsPrefix, 'dropdown-toggle');
    const dropdownContext = useContext(DropdownContext);
    const isInputGroup = useContext(InputGroupContext);
    if (childBsPrefix !== undefined) {
      (ps as any).bsPrefix = childBsPrefix;
    }
    const [toggleProps] = useDropdownToggle();
    toggleProps.ref = useMergedRefs(
      toggleProps.ref,
      useWrappedRefWithWarning(ref, 'DropdownToggle'),
    );
    return (
      <Component
        className={classNames(
          className,
          prefix,
          split && `${prefix}-split`,
          !!isInputGroup && dropdownContext?.show && 'show',
        )}
        {...toggleProps}
        {...ps}
      />
    );
  },
);

DropdownToggle.displayName = 'DropdownToggle';
